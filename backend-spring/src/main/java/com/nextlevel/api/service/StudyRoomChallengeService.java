package com.nextlevel.api.service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.nextlevel.api.dto.CreateChallengeRequest;
import com.nextlevel.api.dto.UpdateChallengeScoreRequest;
import com.nextlevel.api.model.Question;
import com.nextlevel.api.model.RoomMessage;
import com.nextlevel.api.model.StudyRoom;
import com.nextlevel.api.model.StudyRoom.ChallengeScore;
import com.nextlevel.api.model.StudyRoom.ParticipantInfo;
import com.nextlevel.api.model.StudyRoom.RoomChallenge;
import com.nextlevel.api.repository.QuestionRepository;
import com.nextlevel.api.repository.RoomMessageRepository;
import com.nextlevel.api.repository.StudyRoomRepository;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class StudyRoomChallengeService {

    private final StudyRoomRepository studyRoomRepository;
    private final RoomMessageRepository roomMessageRepository;
    private final QuestionRepository questionRepository;
    private final SecureRandom random = new SecureRandom();

    public StudyRoomChallengeService(StudyRoomRepository studyRoomRepository,
                                     RoomMessageRepository roomMessageRepository,
                                     QuestionRepository questionRepository) {
        this.studyRoomRepository = studyRoomRepository;
        this.roomMessageRepository = roomMessageRepository;
        this.questionRepository = questionRepository;
    }

    public StudyRoom createChallenge(StudyRoom room, String userId, String displayName, CreateChallengeRequest req) {
        List<String> targetQuestionIds = req.getQuestionIds();
        boolean hasExams = (req.getExamIds() != null && !req.getExamIds().isEmpty()) 
                || (req.getExamId() != null && !req.getExamId().trim().isEmpty());

        if ((targetQuestionIds == null || targetQuestionIds.isEmpty()) && hasExams) {
            List<String> examIdList = new ArrayList<>();
            if (req.getExamIds() != null && !req.getExamIds().isEmpty()) {
                examIdList.addAll(req.getExamIds());
            }
            if (req.getExamId() != null && !req.getExamId().trim().isEmpty()) {
                for (String part : req.getExamId().split(",")) {
                    String clean = part.trim();
                    if (!clean.isEmpty() && !examIdList.contains(clean)) {
                        examIdList.add(clean);
                    }
                }
            }
            List<Question> candidateQuestions = new ArrayList<>();
            for (String eId : examIdList) {
                List<Question> userQs = questionRepository.findByExamIdAndUserId(eId, userId);
                if (userQs.isEmpty()) {
                    userQs = questionRepository.findByExamId(eId);
                }
                candidateQuestions.addAll(userQs);
            }
            if (!candidateQuestions.isEmpty()) {
                // Strict filter: EXCLUDE ALL MSQs (Multiple Select Questions). Only Single Choice MCQs allowed!
                List<Question> mcqOnly = candidateQuestions.stream()
                        .filter(q -> {
                            if (q.getChooseCount() != null && q.getChooseCount() > 1) return false;
                            if (q.getAnswer() != null && q.getAnswer().size() > 1) return false;
                            if (q.getType() != null) {
                                String t = q.getType().toUpperCase();
                                if (t.contains("MSQ") || t.contains("MULTI") || t.contains("CHECKBOX")) return false;
                            }
                            String sc = q.getScenario() != null ? q.getScenario().toLowerCase() : "";
                            if (sc.contains("select all") || sc.contains("which workarounds are described") || sc.contains("which of the following are")) {
                                if (q.getAnswer() == null || q.getAnswer().size() != 1) return false;
                            }
                            return true;
                        })
                        .collect(Collectors.toList());

                if (!mcqOnly.isEmpty()) {
                    Collections.shuffle(mcqOnly);
                    int limit = Math.min(req.getQuestionCount() != null ? req.getQuestionCount() : 10, mcqOnly.size());
                    targetQuestionIds = mcqOnly.subList(0, limit).stream().map(Question::getId).toList();
                }
            }
        }

        String challengeId = "CH-" + (1000 + random.nextInt(9000));
        String mode = req.getGameMode() != null ? req.getGameMode() : "BLITZ";
        int totalQuestions = targetQuestionIds != null ? targetQuestionIds.size() : (req.getQuestionCount() != null ? req.getQuestionCount() : 10);
        int bossHp = totalQuestions * 100;

        Map<String, String> teamAssignments = new HashMap<>();
        if ("TEAMS".equalsIgnoreCase(mode) && room.getParticipants() != null) {
            int idx = 0;
            for (ParticipantInfo p : room.getParticipants()) {
                teamAssignments.put(p.getUserId(), idx % 2 == 0 ? "ALPHA" : "BETA");
                idx++;
            }
        }

        Integer lobbySec = req.getLobbySeconds() != null ? req.getLobbySeconds() : 0;
        Instant lobbyEndsAt = lobbySec > 0 ? Instant.now().plusSeconds(lobbySec) : null;

        RoomChallenge challenge = RoomChallenge.builder()
                .id(challengeId)
                .title(req.getTitle().trim())
                .examId(req.getExamId())
                .creatorUserId(userId)
                .creatorUserName(displayName)
                .questionCount(totalQuestions)
                .perQuestionSeconds(req.getPerQuestionSeconds() != null ? req.getPerQuestionSeconds() : 30)
                .negativeMarking(Boolean.TRUE.equals(req.getNegativeMarking()))
                .questionIds(targetQuestionIds)
                .gameMode(mode)
                .bossMaxHp(bossHp)
                .bossCurrentHp(bossHp)
                .teamAssignments(teamAssignments)
                .status("INVITING")
                .lobbySeconds(lobbySec)
                .lobbyEndsAt(lobbyEndsAt)
                .createdAt(Instant.now())
                .leaderboard(new ArrayList<>())
                .build();

        room.setActiveChallenge(challenge);
        room.setUpdatedAt(Instant.now());
        StudyRoom saved = studyRoomRepository.save(room);

        // Broadcast Challenge Invitation to room chat!
        Map<String, Object> meta = new HashMap<>();
        meta.put("challengeId", challengeId);
        meta.put("title", challenge.getTitle());
        meta.put("gameMode", mode);
        meta.put("examId", challenge.getExamId());
        meta.put("questionCount", challenge.getQuestionCount());
        meta.put("perQuestionSeconds", challenge.getPerQuestionSeconds());
        meta.put("negativeMarking", challenge.getNegativeMarking());
        meta.put("questionIds", challenge.getQuestionIds());
        meta.put("lobbySeconds", lobbySec);
        if (lobbyEndsAt != null) {
            meta.put("lobbyEndsAt", lobbyEndsAt.toString());
        }

        String modeLabel = switch (mode.toUpperCase()) {
            case "BOSS" -> "Co-op Boss Battle";
            case "SURVIVAL" -> "Survival Elimination";
            case "TEAMS" -> "Squad Team Battle";
            case "FLASHCARDS" -> "Flashcard Jam";
            default -> "OA Blitz Challenge";
        };

        RoomMessage inviteMsg = RoomMessage.builder()
                .roomId(room.getId())
                .userId(userId)
                .userName(displayName)
                .type("CHALLENGE_INVITE")
                .content(displayName + " launched " + modeLabel + ": \"" + challenge.getTitle() + "\" (" + challenge.getQuestionCount() + "Q • " + challenge.getPerQuestionSeconds() + "s/Q)!")
                .metadata(meta)
                .createdAt(Instant.now())
                .build();
        roomMessageRepository.save(inviteMsg);

        return saved;
    }

    public StudyRoom startChallenge(StudyRoom room) {
        if (room.getActiveChallenge() != null) {
            RoomChallenge ch = room.getActiveChallenge();
            ch.setStatus("IN_PROGRESS");
            room.setUpdatedAt(Instant.now());
            return studyRoomRepository.save(room);
        }
        return room;
    }

    public StudyRoom updateChallengeScore(StudyRoom room, String userId, String displayName, UpdateChallengeScoreRequest req) {
        RoomChallenge challenge = room.getActiveChallenge();
        if (challenge == null) {
            return room;
        }

        if (challenge.getLeaderboard() == null) {
            challenge.setLeaderboard(new ArrayList<>());
        }

        // Update Boss HP if boss battle
        if (req.getBossDamageDelta() != null && challenge.getBossCurrentHp() != null) {
            int nextHp = Math.max(0, challenge.getBossCurrentHp() - req.getBossDamageDelta());
            challenge.setBossCurrentHp(nextHp);
        }

        ChallengeScore entry = challenge.getLeaderboard().stream()
                .filter(s -> s.getUserId().equals(userId))
                .findFirst()
                .orElse(null);

        if (entry == null) {
            entry = ChallengeScore.builder()
                    .userId(userId)
                    .userName(displayName)
                    .score(req.getScore() != null ? req.getScore() : 0)
                    .questionsAnswered(req.getQuestionsAnswered() != null ? req.getQuestionsAnswered() : 0)
                    .correctCount(req.getCorrectCount() != null ? req.getCorrectCount() : 0)
                    .avgSpeedSeconds(req.getAvgSpeedSeconds() != null ? req.getAvgSpeedSeconds() : 0.0)
                    .isEliminated(req.getIsEliminated())
                    .team(req.getTeam())
                    .lastUpdated(Instant.now())
                    .build();
            challenge.getLeaderboard().add(entry);
        } else {
            if (req.getScore() != null) entry.setScore(req.getScore());
            if (req.getQuestionsAnswered() != null) entry.setQuestionsAnswered(req.getQuestionsAnswered());
            if (req.getCorrectCount() != null) entry.setCorrectCount(req.getCorrectCount());
            if (req.getAvgSpeedSeconds() != null) entry.setAvgSpeedSeconds(req.getAvgSpeedSeconds());
            if (req.getIsEliminated() != null) entry.setIsEliminated(req.getIsEliminated());
            if (req.getTeam() != null) entry.setTeam(req.getTeam());
            entry.setLastUpdated(Instant.now());
        }

        // Sort leaderboard by score descending
        challenge.getLeaderboard().sort(Comparator.comparingInt(ChallengeScore::getScore).reversed());

        room.setUpdatedAt(Instant.now());
        return studyRoomRepository.save(room);
    }

    public StudyRoom dismissChallenge(StudyRoom room, boolean wasCancelled) {
        if (room.getActiveChallenge() != null) {
            RoomChallenge ch = room.getActiveChallenge();
            boolean isCancelled = wasCancelled || "INVITING".equals(ch.getStatus());
            ch.setStatus(isCancelled ? "CANCELLED" : "COMPLETED");

            if (room.getPastChallenges() == null) {
                room.setPastChallenges(new ArrayList<>());
            }
            room.getPastChallenges().add(0, ch);
            if (room.getPastChallenges().size() > 15) {
                room.setPastChallenges(new ArrayList<>(room.getPastChallenges().subList(0, 15)));
            }

            room.setActiveChallenge(null);
            room.setUpdatedAt(Instant.now());

            String actionText = isCancelled ? "cancelled" : "concluded";
            RoomMessage endMsg = RoomMessage.builder()
                    .roomId(room.getId())
                    .userId("system")
                    .userName("System")
                    .content("Challenge \"" + ch.getTitle() + "\" " + actionText + ".")
                    .type("SYSTEM")
                    .createdAt(Instant.now())
                    .build();
            roomMessageRepository.save(endMsg);
        }

        return studyRoomRepository.save(room);
    }
}
