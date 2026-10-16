package com.nextlevel.api.service;

import java.io.File;
import java.nio.file.Files;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nextlevel.api.dto.InterviewMessageRequest;
import com.nextlevel.api.dto.InterviewSetupRequest;
import com.nextlevel.api.model.InterviewSession;
import com.nextlevel.api.model.InterviewSession.InterviewMessage;
import com.nextlevel.api.model.InterviewSession.InterviewScorecard;
import com.nextlevel.api.model.InterviewSession.QuestionEvaluation;
import com.nextlevel.api.model.StudyFile;
import com.nextlevel.api.repository.InterviewSessionRepository;
import com.nextlevel.api.repository.StudyFileRepository;

@Service
public class InterviewService {

    private static final Logger log = LoggerFactory.getLogger(InterviewService.class);

    private final InterviewSessionRepository interviewRepository;
    private final StudyFileRepository studyFileRepository;
    private final ChatClient chatClient;
    private final ObjectMapper objectMapper;

    public InterviewService(InterviewSessionRepository interviewRepository,
                            StudyFileRepository studyFileRepository,
                            ChatModel chatModel,
                            ObjectMapper objectMapper) {
        this.interviewRepository = interviewRepository;
        this.studyFileRepository = studyFileRepository;
        this.chatClient = ChatClient.builder(chatModel).build();
        this.objectMapper = objectMapper;
    }

    public List<InterviewSession> listSessions(String userId) {
        return interviewRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Optional<InterviewSession> getSession(String userId, String sessionId) {
        return interviewRepository.findByIdAndUserId(sessionId, userId);
    }

    public void deleteSession(String userId, String sessionId) {
        interviewRepository.deleteByIdAndUserId(sessionId, userId);
    }

    public InterviewSession createSession(String userId, InterviewSetupRequest request) {
        Instant now = Instant.now();

        String rawResumeText = "";
        String resumeTitle = "Not provided";

        // 1. Resolve resume context & extract actual text
        if (request.getResumeText() != null && !request.getResumeText().isBlank()) {
            rawResumeText = request.getResumeText();
            resumeTitle = "Uploaded Resume";
        }

        if (rawResumeText.isBlank() && request.getResumeFileId() != null && !request.getResumeFileId().isBlank()) {
            Optional<StudyFile> fileOpt = studyFileRepository.findById(request.getResumeFileId());
            if (fileOpt.isPresent()) {
                StudyFile file = fileOpt.get();
                resumeTitle = file.getTitle() != null ? file.getTitle() : file.getFileName();
                rawResumeText = extractTextFromStudyFile(file);
            }
        }

        // 2. Perform deep project and skill extraction from resume
        ResumeAnalysis analysis = analyzeResume(rawResumeText);
        String resumeSummary = analysis.summary();
        List<String> actualProjects = analysis.projects();
        String candidateName = analysis.candidateName();

        // 3. Generate Opening Question (Introduction + Real Project Grounding)
        String openingPrompt = buildOpeningPrompt(
                request.getRole(),
                request.getExperienceLevel(),
                request.getDurationMinutes(),
                candidateName,
                actualProjects,
                resumeSummary,
                request.getCustomRoleText()
        );

        String openingQuestion;
        try {
            openingQuestion = chatClient.prompt()
                    .system(s -> s.text(openingPrompt))
                    .user("Hello, I am ready to begin my interview.")
                    .call()
                    .content();
        } catch (Exception e) {
            log.error("Failed to generate opening interview question, using fallback", e);
            if (!candidateName.isBlank()) {
                openingQuestion = "Hello " + candidateName + "! Welcome to your " + request.getRole() + " interview. To kick things off, could you briefly introduce yourself and share a bit about your engineering journey?";
            } else {
                openingQuestion = "Hello and welcome to your " + request.getRole() + " mock interview! To get started, could you please introduce yourself and share a bit about your background?";
            }
        }

        List<InterviewMessage> messages = new ArrayList<>();
        messages.add(new InterviewMessage(
                UUID.randomUUID().toString(),
                "interviewer",
                openingQuestion.trim(),
                System.currentTimeMillis()
        ));

        InterviewSession session = new InterviewSession();
        session.setUserId(userId);
        session.setRole(request.getRole());
        session.setExperienceLevel(request.getExperienceLevel());
        session.setDurationMinutes(request.getDurationMinutes());
        session.setStatus("IN_PROGRESS");
        session.setResumeTitle(resumeTitle);
        session.setResumeSummary(resumeSummary);
        session.setCandidateName(candidateName);
        session.setExtractedProjects(actualProjects);
        session.setProctoringInfractions(0);
        session.setMessages(messages);
        session.setCreatedAt(now);
        session.setUpdatedAt(now);

        return interviewRepository.save(session);
    }

    public InterviewSession processCandidateMessage(String userId, String sessionId, InterviewMessageRequest request) {
        InterviewSession session = interviewRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Interview session not found"));

        if ("COMPLETED".equals(session.getStatus())) {
            throw new IllegalStateException("This interview session has already ended.");
        }

        if (request.getProctoringWarnings() != null && request.getProctoringWarnings() > 0) {
            session.setProctoringInfractions(request.getProctoringWarnings());
        }

        boolean isSkip = Boolean.TRUE.equals(request.getIsSkip());
        String candidateContent = isSkip ? "[Candidate elected to skip this question]" : request.getMessage();

        // Add candidate answer
        session.getMessages().add(new InterviewMessage(
                UUID.randomUUID().toString(),
                "candidate",
                candidateContent,
                System.currentTimeMillis()
        ));

        // Calculate time context
        int elapsedMinutes = request.getElapsedSeconds() != null ? Math.max(0, request.getElapsedSeconds() / 60) : 0;
        int remainingMinutes = Math.max(0, session.getDurationMinutes() - elapsedMinutes);

        String systemPrompt = buildConversationalPrompt(
                session.getRole(),
                session.getExperienceLevel(),
                session.getResumeSummary(),
                session.getExtractedProjects(),
                session.getDurationMinutes(),
                remainingMinutes,
                session.getMessages().size(),
                isSkip
        );

        List<Message> history = new ArrayList<>();
        history.add(new SystemMessage(systemPrompt));

        // Append last 10 messages for rich conversational context
        int start = Math.max(0, session.getMessages().size() - 10);
        for (int i = start; i < session.getMessages().size(); i++) {
            InterviewMessage m = session.getMessages().get(i);
            if ("interviewer".equalsIgnoreCase(m.getRole())) {
                history.add(new AssistantMessage(m.getContent()));
            } else {
                history.add(new UserMessage(m.getContent()));
            }
        }

        String nextResponse;
        try {
            nextResponse = chatClient.prompt()
                    .messages(history)
                    .call()
                    .content();
        } catch (Exception e) {
            log.error("Failed to generate next interview message, using fallback", e);
            if (isSkip) {
                nextResponse = "No worries, let's move forward! Could you tell me about how you approach designing robust, scalable REST APIs and handling edge cases?";
            } else {
                nextResponse = "Thank you for sharing that. Building on what you said, could you walk me through how you handled system reliability, error handling, or performance trade-offs in that architecture?";
            }
        }

        session.getMessages().add(new InterviewMessage(
                UUID.randomUUID().toString(),
                "interviewer",
                nextResponse.trim(),
                System.currentTimeMillis()
        ));

        session.setUpdatedAt(Instant.now());
        return interviewRepository.save(session);
    }

    public InterviewSession finishInterview(String userId, String sessionId) {
        InterviewSession session = interviewRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Interview session not found"));

        if ("COMPLETED".equals(session.getStatus()) && session.getScorecard() != null) {
            return session;
        }

        InterviewScorecard scorecard = generateScorecard(session);
        session.setScorecard(scorecard);
        session.setStatus("COMPLETED");
        session.setUpdatedAt(Instant.now());

        return interviewRepository.save(session);
    }

    private InterviewScorecard generateScorecard(InterviewSession session) {
        long substantiveAnswersCount = session.getMessages().stream()
                .filter(m -> "candidate".equalsIgnoreCase(m.getRole()))
                .filter(m -> {
                    String content = m.getContent() != null ? m.getContent().trim() : "";
                    if (content.isEmpty()) return false;
                    String lower = content.toLowerCase();
                    if (lower.contains("[candidate skipped") || lower.contains("[candidate elected to skip")) return false;
                    if (lower.contains("could you clarify the technical requirements") || lower.contains("guiding hint")) return false;
                    // Must have meaningful technical content (at least 20 chars and 4 words)
                    return content.length() >= 20 && content.split("\\s+").length >= 4;
                })
                .count();

        if (substantiveAnswersCount == 0) {
            InterviewScorecard sc = new InterviewScorecard();
            sc.setHiringVerdict("Not Evaluated");
            sc.setOverallScore(0);
            sc.setTechnicalScore(0);
            sc.setCommunicationScore(0);
            sc.setProblemSolvingScore(0);
            sc.setResumeCredibilityScore(0);
            sc.setConfidenceScore(0);
            sc.setFeedbackSummary("The interview concluded with 0 substantive answers submitted. Evaluation could not be performed because no technical answers were provided.");
            sc.setKeyStrengths(List.of("Interview session initialized"));
            sc.setAreasForImprovement(List.of("Speak and submit responses to interview questions to receive a performance evaluation."));
            sc.setQuestionEvaluations(List.of());
            return sc;
        }

        StringBuilder transcriptBuilder = new StringBuilder();
        for (InterviewMessage m : session.getMessages()) {
            transcriptBuilder.append(m.getRole().toUpperCase()).append(": ").append(m.getContent()).append("\n\n");
        }

        boolean isShortSession = substantiveAnswersCount < 3;

        String evaluationPrompt = """
                You are a Senior Staff Technical Hiring Committee Lead at a top technology company.
                Evaluate this technical mock interview transcript for the target role: %s (%s level).
                Resume Profile: %s
                Candidate's Real Projects: %s
                Proctoring Infractions: %d
                Substantive Answers Provided: %d %s

                Transcript:
                \"\"\"
                %s
                \"\"\"

                EVALUATION GUIDELINES:
                1. Objectively evaluate the candidate's actual demonstrated technical competence, architectural trade-offs, and communication clarity from the transcript.
                2. EARLY EXIT CLAUSE: If this session ended early (substantiveAnswersCount < 3), set 'hiringVerdict' to 'Preliminary Assessment (Early Conclusion)'. DO NOT assign a punitive failing score (like 20% or 30%) simply because fewer questions were answered. Grade based on the quality and potential demonstrated, giving a constructive baseline (65-75). Mention in feedbackSummary: "%s".
                3. MODEL ANSWERS: For every question evaluated, provide an exemplary Staff/Senior Engineer 'modelAnswer' with real architectural decisions, specific tech trade-offs, and concrete metrics.

                Produce your evaluation in strictly valid JSON format matching this schema:
                {
                  "hiringVerdict": "%s",
                  "overallScore": 75,
                  "technicalScore": 75,
                  "communicationScore": 75,
                  "problemSolvingScore": 75,
                  "resumeCredibilityScore": 75,
                  "confidenceScore": 75,
                  "feedbackSummary": "Executive 2-3 sentence constructive overview of candidate performance.",
                  "keyStrengths": ["Strength 1", "Strength 2", "Strength 3"],
                  "areasForImprovement": ["Improvement 1", "Improvement 2", "Improvement 3"],
                  "questionEvaluations": [
                    {
                      "question": "Exact question asked by interviewer",
                      "candidateAnswer": "Candidate response summary",
                      "score": 75,
                      "strength": "Specific strength in candidate answer",
                      "weakness": "Specific gap or missed detail",
                      "modelAnswer": "How a Senior/Staff Engineer would answer this question concisely and effectively with concrete architecture and trade-offs"
                    }
                  ]
                }

                Respond ONLY with the raw JSON object, no markdown code block fences, no extraneous preamble.
                """.formatted(
                session.getRole(),
                session.getExperienceLevel(),
                session.getResumeSummary(),
                session.getExtractedProjects() != null ? String.join(", ", session.getExtractedProjects()) : "None",
                session.getProctoringInfractions() != null ? session.getProctoringInfractions() : 0,
                substantiveAnswersCount,
                isShortSession ? "(Early Conclusion - Preliminary Assessment)" : "(Full Round)",
                transcriptBuilder.toString(),
                isShortSession
                        ? "Preliminary evaluation: The candidate completed " + substantiveAnswersCount + " question(s) before concluding early. Highlights and model answers below reflect initial responses."
                        : "Comprehensive technical evaluation based on full round performance.",
                isShortSession ? "Preliminary Assessment (Early Conclusion)" : "Strong Hire | Hire | Lean Hire | Needs Growth | No Hire"
        );

        try {
            String jsonResponse = chatClient.prompt()
                    .system(evaluationPrompt)
                    .user("Please evaluate this interview session and return the JSON scorecard.")
                    .call()
                    .content();

            String cleanJson = jsonResponse.trim();
            int firstBrace = cleanJson.indexOf('{');
            int lastBrace = cleanJson.lastIndexOf('}');
            if (firstBrace >= 0 && lastBrace > firstBrace) {
                cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
            } else {
                if (cleanJson.startsWith("```json")) {
                    cleanJson = cleanJson.substring(7);
                } else if (cleanJson.startsWith("```")) {
                    cleanJson = cleanJson.substring(3);
                }
                if (cleanJson.endsWith("```")) {
                    cleanJson = cleanJson.substring(0, cleanJson.length() - 3);
                }
                cleanJson = cleanJson.trim();
            }

            return objectMapper.readValue(cleanJson, InterviewScorecard.class);
        } catch (Exception ex) {
            log.error("Failed to parse AI scorecard JSON, constructing fallback scorecard", ex);
            return buildFallbackScorecard(session);
        }
    }

    private InterviewScorecard buildFallbackScorecard(InterviewSession session) {
        int estimatedScore = Math.min(85, 55 + session.getMessages().size() * 4);
        String verdict = estimatedScore >= 80 ? "Hire" : "Lean Hire";

        List<QuestionEvaluation> evals = new ArrayList<>();
        List<InterviewMessage> msgs = session.getMessages();
        for (int i = 0; i < msgs.size() - 1; i++) {
            if ("interviewer".equals(msgs.get(i).getRole()) && "candidate".equals(msgs.get(i + 1).getRole())) {
                evals.add(new QuestionEvaluation(
                        msgs.get(i).getContent(),
                        msgs.get(i + 1).getContent(),
                        estimatedScore,
                        "Direct engagement with the question and articulated reasoning.",
                        "Could expand further on quantitative metrics and alternative architectural trade-offs.",
                        "A strong answer highlights concrete technical decisions, trade-offs, and measurable impact."
                ));
            }
        }

        InterviewScorecard sc = new InterviewScorecard();
        sc.setHiringVerdict(verdict);
        sc.setOverallScore(estimatedScore);
        sc.setTechnicalScore(estimatedScore + 2);
        sc.setCommunicationScore(estimatedScore - 1);
        sc.setProblemSolvingScore(estimatedScore);
        sc.setResumeCredibilityScore(estimatedScore + 1);
        sc.setConfidenceScore(estimatedScore);
        sc.setFeedbackSummary("Candidate demonstrated solid conversational communication and engaged with technical challenges.");
        sc.setKeyStrengths(List.of("Clear technical articulation", "Honest problem-solving perspective", "Good role-relevant awareness"));
        sc.setAreasForImprovement(List.of("Incorporate more quantifiable metrics into technical examples", "Deepen trade-off analysis between architectural options"));
        sc.setQuestionEvaluations(evals);
        return sc;
    }

    private String extractTextFromStudyFile(StudyFile file) {
        if (file == null) return "";
        try {
            if (file.getFilePath() != null) {
                File diskFile = new File(file.getFilePath());
                if (diskFile.exists()) {
                    String lowerName = (file.getFileName() != null ? file.getFileName() : "").toLowerCase();
                    if (lowerName.endsWith(".pdf") || "application/pdf".equalsIgnoreCase(file.getMimeType())) {
                        try (PDDocument document = Loader.loadPDF(diskFile)) {
                            PDFTextStripper stripper = new PDFTextStripper();
                            String pdfText = stripper.getText(document);
                            if (pdfText != null && !pdfText.isBlank()) {
                                return pdfText;
                            }
                        }
                    } else if (lowerName.endsWith(".txt") || "text/plain".equalsIgnoreCase(file.getMimeType())) {
                        return Files.readString(diskFile.toPath());
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to extract file text from disk for file {}: {}", file.getFileName(), e.getMessage());
        }

        if (file.getSummary() != null && !file.getSummary().isBlank()) {
            return file.getSummary();
        }
        return file.getFileName() != null ? file.getFileName() : "";
    }

    private ResumeAnalysis analyzeResume(String text) {
        if (text == null || text.isBlank()) {
            return new ResumeAnalysis("", List.of(), "");
        }

        try {
            String prompt = """
                    Analyze this candidate's resume text and extract the key information in JSON format:
                    {
                      "candidateName": "Exact candidate first and last name if present, else ''",
                      "projects": [
                        {
                          "projectName": "Exact title of project as written in the resume",
                          "technologies": "Technologies and tools used for this project",
                          "summary": "1-2 sentence description of what this project does and key achievements"
                        }
                      ],
                      "topSkills": ["Skill 1", "Skill 2"],
                      "profileSummary": "2-3 sentence executive summary of the candidate's technical profile"
                    }

                    IMPORTANT:
                    - You MUST extract the EXACT project names from the candidate's resume (e.g., 'NextLevel', 'CloudVault', etc.).
                    - Do NOT fabricate or invent any company, project, or tool not written in the resume.
                    - Respond with ONLY the raw JSON object. No markdown code blocks.
                    
                    Resume Text:
                    \"\"\"
                    %s
                    \"\"\"
                    """.formatted(text.length() > 7000 ? text.substring(0, 7000) : text);

            String jsonResponse = chatClient.prompt()
                    .system(prompt)
                    .user("Please analyze the candidate's resume and output the structured JSON object as specified.")
                    .call()
                    .content();

            String cleanJson = jsonResponse.trim();
            int firstBrace = cleanJson.indexOf('{');
            int lastBrace = cleanJson.lastIndexOf('}');
            if (firstBrace >= 0 && lastBrace > firstBrace) {
                cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
            }

            JsonNode root = objectMapper.readTree(cleanJson);
            String candidateName = root.path("candidateName").asText("");
            String profileSummary = root.path("profileSummary").asText("");

            List<String> projectNames = new ArrayList<>();
            StringBuilder projectsDetails = new StringBuilder();

            if (root.has("projects") && root.get("projects").isArray()) {
                for (JsonNode p : root.get("projects")) {
                    String pName = p.path("projectName").asText("").trim();
                    String techs = p.path("technologies").asText("").trim();
                    String summary = p.path("summary").asText("").trim();
                    if (!pName.isBlank()) {
                        projectNames.add(pName);
                        projectsDetails.append("• ").append(pName)
                                .append(" [Tech: ").append(techs).append("]: ")
                                .append(summary).append("\n");
                    }
                }
            }

            String fullSummary = (profileSummary.isBlank() ? "" : profileSummary + "\n\n")
                    + "Real Resume Projects:\n" + (projectsDetails.length() > 0 ? projectsDetails.toString() : "None explicitly extracted.");

            return new ResumeAnalysis(candidateName, projectNames, fullSummary);
        } catch (Exception e) {
            log.error("Failed to analyze resume with LLM: {}", e.getMessage());
            return new ResumeAnalysis("", List.of(), text.length() > 500 ? text.substring(0, 500) : text);
        }
    }

    private String buildOpeningPrompt(String role, String level, int duration, String candidateName, List<String> projects, String resumeSummary, String customRoleText) {
        String greetingTarget = (!candidateName.isBlank()) ? candidateName : "the candidate";

        return """
                You are a Senior Staff Engineer and Principal Hiring Interviewer conducting a realistic mock interview.
                Role: %s
                Seniority Level: %s
                Interview Duration: %d minutes
                Candidate Name: %s

                Candidate Profile Context:
                %s

                %s

                MANDATORY INSTRUCTIONS FOR THE FIRST OPENING QUESTION:
                1. Greet %s professionally in 1 natural, warm spoken sentence.
                2. Your FIRST question MUST be SOLELY an introductory question asking the candidate to briefly introduce themselves, their engineering background, and what they have been focusing on recently.
                3. DO NOT ask about any specific project in this opening question! Project-specific questions will happen in question 2 after they introduce themselves.
                4. Keep your opening friendly, natural, and under 35 words total. Speak directly as if in a live voice call.
                """.formatted(
                role, level, duration,
                greetingTarget,
                resumeSummary.isBlank() ? "No resume provided." : resumeSummary,
                customRoleText != null && !customRoleText.isBlank() ? "Target Job Requirements: " + customRoleText : "",
                greetingTarget
        );
    }

    private String buildConversationalPrompt(String role, String level, String resumeSummary, List<String> projects, int totalDuration, int remainingMinutes, int messageCount, boolean isSkip) {
        String phase;
        boolean hasProjects = projects != null && !projects.isEmpty();
        String primaryProject = hasProjects ? projects.get(0) : "";

        if (remainingMinutes <= 3) {
            phase = "WRAP-UP: Thank the candidate for a great conversation, give a brief 1-sentence positive closing note, and invite them to ask any questions they have for you.";
        } else if (messageCount <= 2) {
            if (hasProjects) {
                phase = "PROJECT ARCHITECTURE: The candidate just introduced themselves. Now transition into their real project '" + primaryProject + "'. Ask EXACTLY ONE crisp question about the overall architecture and primary responsibilities of '" + primaryProject + "'. Example: 'Thanks for sharing! I noticed your work on " + primaryProject + ". Could you walk me through its high-level architecture and the core problem it solves?'";
            } else {
                phase = "SYSTEM ARCHITECTURE: The candidate just introduced themselves. Ask EXACTLY ONE crisp question about the most impactful backend system or API they have built, focusing on its architecture and core responsibilities.";
            }
        } else if (messageCount <= 5) {
            phase = "TECHNICAL DEEP-DIVE & TRADE-OFFS: Probe ONE specific technical design decision, concurrency challenge, database/cache strategy, or message queue trade-off based on their stack (" + (hasProjects ? String.join(", ", projects) : "Java / Spring Boot / Distributed Systems") + "). Ask about ONE specific challenge (e.g. data consistency, caching invalidation, or error resilience).";
        } else if (messageCount <= 8) {
            phase = "REAL-WORLD SCENARIO & SYSTEM DESIGN: Present ONE realistic scenario problem or scaling bottleneck relevant to " + role + ". Ask how they would diagnose latency, design for horizontal scale, or handle partition failures.";
        } else {
            phase = "BEHAVIORAL (STAR) & OWNERSHIP: Ask ONE focused situational question (e.g., handling a challenging production outage, technical disagreement on architecture, or tight timeline trade-off).";
        }

        String skipInstruction = isSkip
                ? "The candidate elected to skip the last question. Acknowledge this graciously in one short phrase (e.g., 'No problem, let\\'s pivot!') and ask the next question for the current phase.\n"
                : "";

        return """
                You are a Senior Staff Software Engineer conducting an authentic, engaging technical interview for %s (%s).
                Total Duration: %d mins | Remaining: %d mins.
                Candidate Resume Profile: %s
                Candidate's Real Projects: %s
                CURRENT INTERVIEW PHASE: %s

                %s
                STRICT INTERVIEWER RULES:
                1. STRICT ONE-QUESTION RULE: You MUST ask EXACTLY ONE single, clear question. Never combine multiple sub-questions into a run-on sentence. (BAD: "Can you explain the architecture, why you picked Kafka, and a challenge?" -> GOOD: "Could you walk me through the high-level architecture of your primary backend service?").
                2. CONCISE SPOKEN LENGTH: Keep your entire response under 45 words. Speak naturally as if on a live voice call.
                3. AVOID ROBOTIC TEMPLATES: Never use phrases like 'Regarding the primary project on your resume' or 'As an AI'. Speak like a friendly, sharp Staff Engineer (e.g., 'I saw you worked with Kafka and Spring Boot...', 'In that pipeline, how did you handle...').
                4. ACTIVE LISTENING: React briefly in half a sentence to the candidate's last answer before asking your next targeted question.
                5. NO LECTURING: Do not give lengthy speeches, answers, or tutorials. Your role is strictly to guide the interview and evaluate.
                6. NO FORMATTING: Do NOT output bullet points, markdown bolding, or headers. Output plain conversational spoken text only.
                """.formatted(
                role, level, totalDuration, remainingMinutes,
                resumeSummary.isBlank() ? "General technical background" : resumeSummary,
                hasProjects ? String.join(", ", projects) : "General background",
                phase,
                skipInstruction
        );
    }

    private record ResumeAnalysis(String candidateName, List<String> projects, String summary) {}
}

