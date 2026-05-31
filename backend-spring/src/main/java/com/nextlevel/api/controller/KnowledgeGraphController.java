package com.nextlevel.api.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nextlevel.api.dto.ApiResponse;
import com.nextlevel.api.security.CurrentUser;
import com.nextlevel.api.service.KnowledgeGraphService;

@RestController
@RequestMapping("/api/graph")
public class KnowledgeGraphController {

    private final KnowledgeGraphService knowledgeGraphService;

    public KnowledgeGraphController(KnowledgeGraphService knowledgeGraphService) {
        this.knowledgeGraphService = knowledgeGraphService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getGraph(@AuthenticationPrincipal CurrentUser currentUser) {
        Map<String, Object> data = knowledgeGraphService.getGraphData(currentUser.getUserId());
        return ResponseEntity.ok(ApiResponse.success(data));
    }
}
