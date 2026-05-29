package com.nextlevel.api.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.nextlevel.api.dto.ApiResponse;
import com.nextlevel.api.dto.RoadmapCreateRequest;
import com.nextlevel.api.dto.RoadmapPatchRequest;
import com.nextlevel.api.model.Roadmap;
import com.nextlevel.api.security.CurrentUser;
import com.nextlevel.api.service.RoadmapService;

@RestController
@RequestMapping("/api/roadmaps")
public class RoadmapController {

    private final RoadmapService roadmapService;

    public RoadmapController(RoadmapService roadmapService) {
        this.roadmapService = roadmapService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Object>> list(@AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String templates) {
        if ("true".equals(templates)) {
            return ResponseEntity.ok(ApiResponse.success(roadmapService.getDefaultTemplates()));
        }

        List<Roadmap> roadmaps = roadmapService.listRoadmaps(currentUser.getUserId(), status);
        return ResponseEntity.ok(ApiResponse.success(roadmaps));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Roadmap>> create(@AuthenticationPrincipal CurrentUser currentUser,
            @Validated @RequestBody RoadmapCreateRequest request) {
        Roadmap roadmap = roadmapService.createRoadmap(currentUser.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(roadmap));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Roadmap>> get(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable String id) {
        return roadmapService.getRoadmap(id, currentUser.getUserId())
                .map(r -> ResponseEntity.ok(ApiResponse.success(r)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Not found")));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<Roadmap>> patch(@AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String id,
            @Validated @RequestBody RoadmapPatchRequest request) {
        try {
            Roadmap roadmap = roadmapService.patchRoadmap(id, currentUser.getUserId(), request);
            return ResponseEntity.ok(ApiResponse.success(roadmap));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable String id) {
        roadmapService.deleteRoadmap(id, currentUser.getUserId());
        return ResponseEntity.ok(ApiResponse.message("Deleted"));
    }
}
