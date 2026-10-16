package com.nextlevel.api.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "interviews")
public class InterviewSession {

    @Id
    private String id;
    private String userId;
    private String role;
    private String experienceLevel;
    private Integer durationMinutes;
    private String status = "IN_PROGRESS"; // IN_PROGRESS, COMPLETED
    private String resumeTitle;
    private String resumeSummary;
    private String candidateName;
    private List<String> extractedProjects = new ArrayList<>();
    private Integer proctoringInfractions = 0;
    private List<InterviewMessage> messages = new ArrayList<>();
    private InterviewScorecard scorecard;
    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    public InterviewSession() {}

    public InterviewSession(String id, String userId, String role, String experienceLevel,
                            Integer durationMinutes, String status, String resumeTitle,
                            String resumeSummary, String candidateName, List<String> extractedProjects,
                            Integer proctoringInfractions, List<InterviewMessage> messages,
                            InterviewScorecard scorecard, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.userId = userId;
        this.role = role;
        this.experienceLevel = experienceLevel;
        this.durationMinutes = durationMinutes;
        this.status = status;
        this.resumeTitle = resumeTitle;
        this.resumeSummary = resumeSummary;
        this.candidateName = candidateName;
        this.extractedProjects = extractedProjects;
        this.proctoringInfractions = proctoringInfractions;
        this.messages = messages;
        this.scorecard = scorecard;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getExperienceLevel() { return experienceLevel; }
    public void setExperienceLevel(String experienceLevel) { this.experienceLevel = experienceLevel; }
    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getResumeTitle() { return resumeTitle; }
    public void setResumeTitle(String resumeTitle) { this.resumeTitle = resumeTitle; }
    public String getResumeSummary() { return resumeSummary; }
    public void setResumeSummary(String resumeSummary) { this.resumeSummary = resumeSummary; }
    public String getCandidateName() { return candidateName; }
    public void setCandidateName(String candidateName) { this.candidateName = candidateName; }
    public List<String> getExtractedProjects() { return extractedProjects; }
    public void setExtractedProjects(List<String> extractedProjects) { this.extractedProjects = extractedProjects; }
    public Integer getProctoringInfractions() { return proctoringInfractions; }
    public void setProctoringInfractions(Integer proctoringInfractions) { this.proctoringInfractions = proctoringInfractions; }
    public List<InterviewMessage> getMessages() { return messages; }
    public void setMessages(List<InterviewMessage> messages) { this.messages = messages; }
    public InterviewScorecard getScorecard() { return scorecard; }
    public void setScorecard(InterviewScorecard scorecard) { this.scorecard = scorecard; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    // ─── Nested: InterviewMessage ───
    public static class InterviewMessage {
        private String id;
        private String role; // interviewer, candidate
        private String content;
        private Long timestamp;

        public InterviewMessage() {}

        public InterviewMessage(String id, String role, String content, Long timestamp) {
            this.id = id;
            this.role = role;
            this.content = content;
            this.timestamp = timestamp;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        public Long getTimestamp() { return timestamp; }
        public void setTimestamp(Long timestamp) { this.timestamp = timestamp; }
    }

    // ─── Nested: InterviewScorecard ───
    public static class InterviewScorecard {
        private String hiringVerdict; // Strong Hire, Hire, Lean Hire, No Hire
        private Integer overallScore;
        private Integer technicalScore;
        private Integer communicationScore;
        private Integer problemSolvingScore;
        private Integer resumeCredibilityScore;
        private Integer confidenceScore;
        private String feedbackSummary;
        private List<String> keyStrengths = new ArrayList<>();
        private List<String> areasForImprovement = new ArrayList<>();
        private List<QuestionEvaluation> questionEvaluations = new ArrayList<>();

        public InterviewScorecard() {}

        public InterviewScorecard(String hiringVerdict, Integer overallScore, Integer technicalScore,
                                  Integer communicationScore, Integer problemSolvingScore,
                                  Integer resumeCredibilityScore, Integer confidenceScore,
                                  String feedbackSummary, List<String> keyStrengths,
                                  List<String> areasForImprovement, List<QuestionEvaluation> questionEvaluations) {
            this.hiringVerdict = hiringVerdict;
            this.overallScore = overallScore;
            this.technicalScore = technicalScore;
            this.communicationScore = communicationScore;
            this.problemSolvingScore = problemSolvingScore;
            this.resumeCredibilityScore = resumeCredibilityScore;
            this.confidenceScore = confidenceScore;
            this.feedbackSummary = feedbackSummary;
            this.keyStrengths = keyStrengths;
            this.areasForImprovement = areasForImprovement;
            this.questionEvaluations = questionEvaluations;
        }

        public String getHiringVerdict() { return hiringVerdict; }
        public void setHiringVerdict(String hiringVerdict) { this.hiringVerdict = hiringVerdict; }
        public Integer getOverallScore() { return overallScore; }
        public void setOverallScore(Integer overallScore) { this.overallScore = overallScore; }
        public Integer getTechnicalScore() { return technicalScore; }
        public void setTechnicalScore(Integer technicalScore) { this.technicalScore = technicalScore; }
        public Integer getCommunicationScore() { return communicationScore; }
        public void setCommunicationScore(Integer communicationScore) { this.communicationScore = communicationScore; }
        public Integer getProblemSolvingScore() { return problemSolvingScore; }
        public void setProblemSolvingScore(Integer problemSolvingScore) { this.problemSolvingScore = problemSolvingScore; }
        public Integer getResumeCredibilityScore() { return resumeCredibilityScore; }
        public void setResumeCredibilityScore(Integer resumeCredibilityScore) { this.resumeCredibilityScore = resumeCredibilityScore; }
        public Integer getConfidenceScore() { return confidenceScore; }
        public void setConfidenceScore(Integer confidenceScore) { this.confidenceScore = confidenceScore; }
        public String getFeedbackSummary() { return feedbackSummary; }
        public void setFeedbackSummary(String feedbackSummary) { this.feedbackSummary = feedbackSummary; }
        public List<String> getKeyStrengths() { return keyStrengths; }
        public void setKeyStrengths(List<String> keyStrengths) { this.keyStrengths = keyStrengths; }
        public List<String> getAreasForImprovement() { return areasForImprovement; }
        public void setAreasForImprovement(List<String> areasForImprovement) { this.areasForImprovement = areasForImprovement; }
        public List<QuestionEvaluation> getQuestionEvaluations() { return questionEvaluations; }
        public void setQuestionEvaluations(List<QuestionEvaluation> questionEvaluations) { this.questionEvaluations = questionEvaluations; }
    }

    // ─── Nested: QuestionEvaluation ───
    public static class QuestionEvaluation {
        private String question;
        private String candidateAnswer;
        private Integer score;
        private String strength;
        private String weakness;
        private String modelAnswer;

        public QuestionEvaluation() {}

        public QuestionEvaluation(String question, String candidateAnswer, Integer score,
                                  String strength, String weakness, String modelAnswer) {
            this.question = question;
            this.candidateAnswer = candidateAnswer;
            this.score = score;
            this.strength = strength;
            this.weakness = weakness;
            this.modelAnswer = modelAnswer;
        }

        public String getQuestion() { return question; }
        public void setQuestion(String question) { this.question = question; }
        public String getCandidateAnswer() { return candidateAnswer; }
        public void setCandidateAnswer(String candidateAnswer) { this.candidateAnswer = candidateAnswer; }
        public Integer getScore() { return score; }
        public void setScore(Integer score) { this.score = score; }
        public String getStrength() { return strength; }
        public void setStrength(String strength) { this.strength = strength; }
        public String getWeakness() { return weakness; }
        public void setWeakness(String weakness) { this.weakness = weakness; }
        public String getModelAnswer() { return modelAnswer; }
        public void setModelAnswer(String modelAnswer) { this.modelAnswer = modelAnswer; }
    }
}
