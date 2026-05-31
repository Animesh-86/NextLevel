package com.nextlevel.api.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.nextlevel.api.dto.ApiResponse;
import com.nextlevel.api.security.CurrentUser;
import com.nextlevel.api.service.KnowledgeGraphService;

@RestController
@RequestMapping("/api/related")
public class RelatedController {

    private final KnowledgeGraphService knowledgeGraphService;

    public RelatedController(KnowledgeGraphService knowledgeGraphService) {
        this.knowledgeGraphService = knowledgeGraphService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRelated(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam String itemId,
            @RequestParam String type) {
        List<Map<String, Object>> related = knowledgeGraphService.getRelatedItems(currentUser.getUserId(), itemId, type);
        return ResponseEntity.ok(ApiResponse.success(related));
    }
}
