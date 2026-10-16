package com.nextlevel.api.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "study_rooms")
@CompoundIndex(def = "{'active': 1, 'category': 1, 'updatedAt': -1}")
public class StudyRoom {

    @Id
    private String id;

    @Indexed(unique = true)
    private String roomCode; // e.g. "NL-8472"

    private String title;
    private String description;
    private String category; // "all", "dsa", "gate", "core_cs", "focus", "general"

    public String getName() { return title; }

    private String hostUserId;
    private String hostUserName;

    @Builder.Default
    private Boolean isPrivate = false;

    @com.fasterxml.jackson.annotation.JsonProperty(access = com.fasterxml.jackson.annotation.JsonProperty.Access.WRITE_ONLY)
    private String accessPin; // Optional 4-digit PIN for private rooms

    @Builder.Default
    private Integer maxParticipants = 1000;

    @Builder.Default
    private String timerMode = "INDEPENDENT"; // "SYNCHRONIZED" | "INDEPENDENT"

    @Builder.Default
    private String ambientSound = "none"; // "lofi", "brown_noise", "rain", "cafe", "none"

    @Builder.Default
    private Integer timerDuration = 1500; // 25 minutes default

    @Builder.Default
    private String timerState = "IDLE"; // "IDLE" | "RUNNING" | "PAUSED" | "BREAK"

    private Instant timerStartedAt;

    // Room Expiry
    private Instant expiresAt; // null = No Expiry (Permanent until closed)
    private Integer expiryMinutes; // 30, 60, 120, 240, 0 (no expiry)

    // Live Instant Blitz Challenge in Room
    private RoomChallenge activeChallenge;

    // Challenge History in this Room
    @Builder.Default
    private List<RoomChallenge> pastChallenges = new ArrayList<>();

    @Builder.Default
    private List<ParticipantInfo> participants = new ArrayList<>();

    @Builder.Default
    private Integer participantCount = 0;

    @Builder.Default
    private Boolean active = true;

    private Instant createdAt;
    private Instant updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParticipantInfo {
        private String userId;
        private String userName;
        private String userAvatar;
        private String status; // "FOCUSING", "TESTING", "BREAK", "IDLE"
        private String currentTask;
        private String goal; // One-line study goal
        private Boolean isMuted;
        private Integer timerSecondsLeft;
        private Integer streak;
        private Instant joinedAt;
        private Instant lastHeartbeat;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoomChallenge {
        private String id;
        private String title;
        private String examId;
        private String creatorUserId;
        private String creatorUserName;
        private Integer questionCount;
        private Integer perQuestionSeconds;
        @Builder.Default
        private Boolean negativeMarking = false;
        private List<String> questionIds;
        @Builder.Default
        private String gameMode = "BLITZ"; // "BLITZ", "BOSS", "SURVIVAL", "TEAMS", "FLASHCARDS"
        private Integer bossMaxHp;
        private Integer bossCurrentHp;
        private java.util.Map<String, String> teamAssignments;
        @Builder.Default
        private String status = "INVITING"; // "INVITING", "IN_PROGRESS", "COMPLETED"
        private Integer lobbySeconds;
        private Instant lobbyEndsAt;
        private Instant createdAt;
        @Builder.Default
        private List<ChallengeScore> leaderboard = new ArrayList<>();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChallengeScore {
        private String userId;
        private String userName;
        private String team; // "ALPHA" | "BETA"
        private Boolean isEliminated;
        @Builder.Default
        private Integer score = 0;
        @Builder.Default
        private Integer questionsAnswered = 0;
        @Builder.Default
        private Integer correctCount = 0;
        @Builder.Default
        private Double avgSpeedSeconds = 0.0;
        private Instant lastUpdated;
    }
}
