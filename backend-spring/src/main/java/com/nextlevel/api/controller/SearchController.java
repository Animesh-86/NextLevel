package com.nextlevel.api.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.nextlevel.api.dto.ApiResponse;
import com.nextlevel.api.model.Capture;
import com.nextlevel.api.security.CurrentUser;
import com.nextlevel.api.service.SemanticSearchService;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final SemanticSearchService semanticSearchService;

    public SearchController(SemanticSearchService semanticSearchService) {
        this.semanticSearchService = semanticSearchService;
    }

    @GetMapping("/semantic")
    public ResponseEntity<ApiResponse<List<Capture>>> semantic(@AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam(name = "q") String query) {
        if (query == null || query.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Query is required"));
        }

        List<Capture> result = semanticSearchService.search(currentUser.getUserId(), query);

        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
