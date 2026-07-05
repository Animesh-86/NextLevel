package com.nextlevel.api.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.nextlevel.api.model.Result;
import com.nextlevel.api.model.User;
import com.nextlevel.api.repository.ResultRepository;
import com.nextlevel.api.repository.UserRepository;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ResultServiceTest {

    @Mock
    private ResultRepository resultRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private com.nextlevel.api.repository.ExamRepository examRepository;

    @Mock
    private com.nextlevel.api.repository.QuestionRepository questionRepository;

    private ResultService resultService;

    @BeforeEach
    void setUp() {
        resultService = new ResultService(resultRepository, userRepository, examRepository, questionRepository);
    }

    @Test
    void testCreateResultUpdatesUserStreak() {
        com.nextlevel.api.dto.ExamGradingRequest req = new com.nextlevel.api.dto.ExamGradingRequest();
        ReflectionTestUtils.setField(req, "examId", "e1");
        ReflectionTestUtils.setField(req, "userAnswers", java.util.Map.of());
        ReflectionTestUtils.setField(req, "timeTaken", 60.0);

        User user = new User();
        user.setId("u1");
        user.setStreak(1);

        Result saved = new Result();
        saved.setId("res1");
        saved.setUserId("u1");
        saved.setScorePercent(0.0);

        com.nextlevel.api.model.Exam exam = new com.nextlevel.api.model.Exam();
        exam.setId("e1");
        exam.setUserId("u1");
        exam.setPassPercentage(70);

        when(examRepository.findById("e1")).thenReturn(Optional.of(exam));
        when(questionRepository.findByExamIdAndUserId("e1", "u1")).thenReturn(java.util.List.of());
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(resultRepository.save(any(Result.class))).thenReturn(saved);

        Result res = resultService.createResult("u1", req);
        assertNotNull(res);
        assertEquals(0.0, res.getScorePercent());

        verify(userRepository).save(user); // streak should be updated, or at least save called
    }

    @Test
    void testCreateResultDeniesCrossUserAccess() {
        com.nextlevel.api.dto.ExamGradingRequest req = new com.nextlevel.api.dto.ExamGradingRequest();
        ReflectionTestUtils.setField(req, "examId", "e1");
        ReflectionTestUtils.setField(req, "userAnswers", java.util.Map.of());
        ReflectionTestUtils.setField(req, "timeTaken", 60.0);

        com.nextlevel.api.model.Exam exam = new com.nextlevel.api.model.Exam();
        exam.setId("e1");
        exam.setUserId("otherUser");
        exam.setPassPercentage(70);

        when(examRepository.findById("e1")).thenReturn(Optional.of(exam));

        org.junit.jupiter.api.Assertions.assertThrows(IllegalArgumentException.class, () -> {
            resultService.createResult("u1", req);
        });
    }
}
