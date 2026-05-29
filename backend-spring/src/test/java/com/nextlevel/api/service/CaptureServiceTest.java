package com.nextlevel.api.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.nextlevel.api.dto.CaptureCreateRequest;
import com.nextlevel.api.model.Capture;
import com.nextlevel.api.repository.CaptureRepository;

@ExtendWith(MockitoExtension.class)
public class CaptureServiceTest {

    @Mock
    private CaptureRepository captureRepository;

    private CaptureService captureService;

    @BeforeEach
    void setUp() {
        captureService = new CaptureService(captureRepository);
    }

    @Test
    void testCreateCapture_Success() {
        String userId = "user123";
        CaptureCreateRequest request = new CaptureCreateRequest();
        request.setRawContent("This is a test capture.");

        Capture mockSavedCapture = new Capture();
        mockSavedCapture.setId("cap123");
        mockSavedCapture.setUserId(userId);
        mockSavedCapture.setRawContent(request.getRawContent());
        mockSavedCapture.setStatus("active");

        when(captureRepository.save(any(Capture.class))).thenReturn(mockSavedCapture);

        Capture result = captureService.createCapture(userId, request);

        assertNotNull(result);
        assertEquals("cap123", result.getId());
        assertEquals("active", result.getStatus());

        ArgumentCaptor<Capture> captureCaptor = ArgumentCaptor.forClass(Capture.class);
        verify(captureRepository).save(captureCaptor.capture());

        Capture savedCapture = captureCaptor.getValue();
        assertEquals(userId, savedCapture.getUserId());
        assertEquals("This is a test capture.", savedCapture.getRawContent());
        assertEquals("active", savedCapture.getStatus());
    }
}
