package com.nextlevel.api.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import com.nextlevel.api.model.Question;
import com.nextlevel.api.repository.QuestionRepository;

@Service
public class SpacedRepetitionService {

    private final QuestionRepository questionRepository;
    private final MongoTemplate mongoTemplate;
    private final GamificationService gamificationService;

    public SpacedRepetitionService(QuestionRepository questionRepository, MongoTemplate mongoTemplate, GamificationService gamificationService) {
        this.questionRepository = questionRepository;
        this.mongoTemplate = mongoTemplate;
        this.gamificationService = gamificationService;
    }

    public List<Question> getDueReviews(int limit) {
        Query query = new Query();
        Criteria criteria = new Criteria().orOperator(
                Criteria.where("nextReviewDate").lte(Instant.now()),
                Criteria.where("nextReviewDate").exists(false),
                Criteria.where("nextReviewDate").is(null)
        );
        query.addCriteria(criteria);
        query.limit(limit);
        return mongoTemplate.find(query, Question.class);
    }

    public Question processReview(String questionId, int quality, String userId) {
        Question question = questionRepository.findById(questionId).orElseThrow(() -> new RuntimeException("Question not found"));

        int repetitions = question.getRepetitions() == null ? 0 : question.getRepetitions();
        double easeFactor = question.getEaseFactor() == null ? 2.5 : question.getEaseFactor();
        int interval = question.getInterval() == null ? 0 : question.getInterval();

        // SM-2 Algorithm Implementation
        if (quality >= 3) { // Correct response
            if (repetitions == 0) {
                interval = 1;
            } else if (repetitions == 1) {
                interval = 6;
            } else {
                interval = (int) Math.round(interval * easeFactor);
            }
            repetitions++;
            
            // Award XP for a successful review
            if (userId != null) {
                gamificationService.awardXp(userId, 10, "Completed spaced repetition review");
            }
        } else { // Incorrect response
            repetitions = 0;
            interval = 1;
        }

        easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        if (easeFactor < 1.3) {
            easeFactor = 1.3;
        }

        question.setRepetitions(repetitions);
        question.setEaseFactor(easeFactor);
        question.setInterval(interval);
        question.setNextReviewDate(Instant.now().plus(interval, ChronoUnit.DAYS));
        question.setUpdatedAt(Instant.now());

        return questionRepository.save(question);
    }
}
