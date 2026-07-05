package com.nextlevel.api.service;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.nextlevel.api.dto.ExamCreateRequest;
import com.nextlevel.api.dto.ExamUpdateRequest;
import com.nextlevel.api.model.Exam;
import com.nextlevel.api.repository.ExamRepository;
import com.nextlevel.api.repository.QuestionRepository;
import com.nextlevel.api.repository.ResultRepository;
import com.nextlevel.api.security.CurrentUser;
import com.nextlevel.api.model.Exam;
import com.nextlevel.api.repository.ExamRepository;
import com.nextlevel.api.repository.QuestionRepository;
import com.nextlevel.api.repository.ResultRepository;

@Service
public class ExamService {

    private static final Logger log = LoggerFactory.getLogger(ExamService.class);
    private final ExamRepository examRepository;
    private final QuestionRepository questionRepository;
    private final ResultRepository resultRepository;

    public ExamService(ExamRepository examRepository, QuestionRepository questionRepository, ResultRepository resultRepository) {
        this.examRepository = examRepository;
        this.questionRepository = questionRepository;
        this.resultRepository = resultRepository;
    }

    public List<Map<String, Object>> listExams(CurrentUser user) {
        log.info("Listing all exams for user: {}", user.getUserId());
        return examRepository.findByUserIdOrderByCreatedAtDesc(user.getUserId()).stream().map(exam -> {
            Map<String, Object> row = new HashMap<>();
            row.put("id", exam.getId());
            row.put("title", exam.getTitle());
            row.put("description", exam.getDescription());
            row.put("timeLimit", exam.getTimeLimit());
            row.put("passPercentage", exam.getPassPercentage());
            row.put("createdAt", exam.getCreatedAt());
            row.put("updatedAt", exam.getUpdatedAt());
            row.put("questionCount", questionRepository.countByExamId(exam.getId()));
            return row;
        }).toList();
    }

    public Exam createExam(ExamCreateRequest request, CurrentUser user) {
        log.info("Creating exam: {} for user: {}", request.title(), user.getUserId());
        Instant now = Instant.now();
        Exam exam = new Exam();
        exam.setUserId(user.getUserId());
        exam.setTitle(request.title().trim());
        exam.setDescription(request.description() != null ? request.description() : "");
        exam.setTimeLimit(request.timeLimit() != null ? request.timeLimit() : 60);
        exam.setPassPercentage(request.passPercentage() != null ? request.passPercentage() : 75);
        exam.setCreatedAt(now);
        exam.setUpdatedAt(now);
        return examRepository.save(exam);
    }

    public Optional<Map<String, Object>> getExamDetails(String id) {
        log.info("Fetching details for exam: {}", id);
        return examRepository.findById(id).map(exam -> {
            long questionCount = questionRepository.countByExamId(id);
            var all = resultRepository.findByExamId(id);
            int timesTaken = all.size();
            double avg = timesTaken == 0 ? 0 : all.stream().mapToDouble(r -> r.getScorePercent() == null ? 0 : r.getScorePercent()).average().orElse(0);
            long passCount = all.stream().filter(r -> Boolean.TRUE.equals(r.getPassed())).count();

            Map<String, Object> data = new HashMap<>();
            data.put("id", exam.getId());
            data.put("title", exam.getTitle());
            data.put("description", exam.getDescription());
            data.put("timeLimit", exam.getTimeLimit());
            data.put("passPercentage", exam.getPassPercentage());
            data.put("createdAt", exam.getCreatedAt());
            data.put("updatedAt", exam.getUpdatedAt());
            data.put("questionCount", questionCount);
            data.put("avgScore", Math.round(avg));
            data.put("timesTaken", timesTaken);
            data.put("passRate", timesTaken > 0 ? Math.round((passCount * 100.0) / timesTaken) : 0);
            return data;
        });
    }

    public Optional<Exam> updateExam(String id, ExamUpdateRequest request, CurrentUser user) {
        log.info("Updating exam: {}", id);
        return examRepository.findById(id).map(exam -> {
            if (!user.getUserId().equals(exam.getUserId()) && !user.isAdmin()) {
                throw new SecurityException("Forbidden: You do not own this exam");
            }
            if (request.title() != null) exam.setTitle(request.title());
            if (request.description() != null) exam.setDescription(request.description());
            if (request.timeLimit() != null) exam.setTimeLimit(request.timeLimit());
            if (request.passPercentage() != null) exam.setPassPercentage(request.passPercentage());
            exam.setUpdatedAt(Instant.now());
            return examRepository.save(exam);
        });
    }

    public boolean deleteExam(String id, CurrentUser user) {
        log.info("Deleting exam: {}", id);
        Optional<Exam> examOpt = examRepository.findById(id);
        if (examOpt.isPresent()) {
            Exam exam = examOpt.get();
            if (!user.getUserId().equals(exam.getUserId()) && !user.isAdmin()) {
                throw new SecurityException("Forbidden: You do not own this exam");
            }
            examRepository.delete(exam);
            if (user.isAdmin()) {
                questionRepository.deleteByExamId(id);
            } else {
                questionRepository.deleteByExamIdAndUserId(id, user.getUserId());
            }
            return true;
        }
        return false;
    }
}
