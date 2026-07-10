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

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.RequestParam;
import reactor.core.publisher.Flux;

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

    @GetMapping(value = "/explore", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> exploreNode(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam String nodeId) {
        return knowledgeGraphService.exploreNode(currentUser.getUserId(), nodeId);
    }
}
