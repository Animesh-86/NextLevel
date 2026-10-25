package com.nextlevel.api.service;

import java.io.File;
import java.nio.file.Files;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
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

import com.nextlevel.api.dto.InterviewMessageRequest;
import com.nextlevel.api.dto.InterviewSetupRequest;
import com.nextlevel.api.model.InterviewSession;
import com.nextlevel.api.model.InterviewSession.InterviewMessage;
import com.nextlevel.api.model.InterviewSession.InterviewScorecard;
import com.nextlevel.api.model.StudyFile;
import com.nextlevel.api.repository.InterviewSessionRepository;
import com.nextlevel.api.repository.StudyFileRepository;
import com.nextlevel.api.service.InterviewEvaluationService.ResumeAnalysis;

@Service
public class InterviewService {

    private static final Logger log = LoggerFactory.getLogger(InterviewService.class);

    private final InterviewSessionRepository interviewRepository;
    private final StudyFileRepository studyFileRepository;
    private final InterviewEvaluationService evaluationService;
    private final ChatClient chatClient;

    public InterviewService(InterviewSessionRepository interviewRepository,
                            StudyFileRepository studyFileRepository,
                            InterviewEvaluationService evaluationService,
                            ChatModel chatModel) {
        this.interviewRepository = interviewRepository;
        this.studyFileRepository = studyFileRepository;
        this.evaluationService = evaluationService;
        this.chatClient = ChatClient.builder(chatModel).build();
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
        ResumeAnalysis analysis = evaluationService.analyzeResume(rawResumeText);
        String resumeSummary = analysis.summary();
        List<String> actualProjects = analysis.projects();
        String candidateName = analysis.candidateName();

        // 3. Generate Opening Question (Introduction + Real Project Grounding)
        String openingPrompt = evaluationService.buildOpeningPrompt(
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

        String systemPrompt = evaluationService.buildConversationalPrompt(
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

        InterviewScorecard scorecard = evaluationService.generateScorecard(session);
        session.setScorecard(scorecard);
        session.setStatus("COMPLETED");
        session.setUpdatedAt(Instant.now());

        return interviewRepository.save(session);
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
}
