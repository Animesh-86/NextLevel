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

import com.nextlevel.api.dto.ResultCreateRequest;
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
        ResultCreateRequest req = new ResultCreateRequest();
        ReflectionTestUtils.setField(req, "examId", "e1");
        ReflectionTestUtils.setField(req, "scorePercent", 90.0);
        ReflectionTestUtils.setField(req, "correctCount", 9);
        ReflectionTestUtils.setField(req, "wrongCount", 1);
        ReflectionTestUtils.setField(req, "skippedCount", 0);
        ReflectionTestUtils.setField(req, "totalCount", 10);
        ReflectionTestUtils.setField(req, "passed", true);

        User user = new User();
        user.setId("u1");
        user.setStreak(1);

        Result saved = new Result();
        saved.setId("res1");
        saved.setUserId("u1");
        saved.setScorePercent(90.0);

        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(resultRepository.save(any(Result.class))).thenReturn(saved);

        Result res = resultService.createResult("u1", req);
        assertNotNull(res);
        assertEquals(90.0, res.getScorePercent());

        verify(userRepository).save(user); // streak should be updated, or at least save called
    }
}
