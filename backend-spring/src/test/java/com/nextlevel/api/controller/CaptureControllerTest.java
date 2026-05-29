package com.nextlevel.api.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nextlevel.api.dto.CaptureCreateRequest;
import com.nextlevel.api.model.Capture;
import com.nextlevel.api.service.CaptureService;
import org.springframework.context.annotation.Import;
import com.nextlevel.api.config.SecurityConfig;
import com.nextlevel.api.security.JwtAuthenticationFilter;
import com.nextlevel.api.security.OAuth2LoginSuccessHandler;
import com.nextlevel.api.security.JwtService;

@WebMvcTest(CaptureController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
@AutoConfigureMockMvc(addFilters = false)
class CaptureControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CaptureService captureService;
    
    @MockBean
    private JwtService jwtService;
    
    @MockBean
    private OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;

    @Test
    void testCreateCaptureValidationFail() throws Exception {
        // Missing rawContent which has @NotBlank
        CaptureCreateRequest req = new CaptureCreateRequest();
        req.setRawContent("");
        
        mockMvc.perform(post("/api/captures")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }
}
