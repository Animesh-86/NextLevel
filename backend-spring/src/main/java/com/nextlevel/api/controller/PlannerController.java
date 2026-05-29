package com.nextlevel.api.controller;

import java.time.Instant;
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
import com.nextlevel.api.dto.PlannerTaskCreateRequest;
import com.nextlevel.api.dto.PlannerTaskPatchRequest;
import com.nextlevel.api.model.PlannerTask;
import com.nextlevel.api.security.CurrentUser;
import com.nextlevel.api.service.PlannerService;

@RestController
@RequestMapping("/api/planner")
public class PlannerController {

    private final PlannerService plannerService;

    public PlannerController(PlannerService plannerService) {
        this.plannerService = plannerService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PlannerTask>>> list(@AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam String start,
            @RequestParam String end) {
        Instant s = Instant.parse(start + "T00:00:00Z");
        Instant e = Instant.parse(end + "T23:59:59Z");
        
        List<PlannerTask> tasks = plannerService.listTasks(currentUser.getUserId(), s, e);
        return ResponseEntity.ok(ApiResponse.success(tasks));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PlannerTask>> create(@AuthenticationPrincipal CurrentUser currentUser,
            @Validated @RequestBody PlannerTaskCreateRequest request) {
        PlannerTask task = plannerService.createTask(currentUser.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(task));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PlannerTask>> patch(@AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String id,
            @Validated @RequestBody PlannerTaskPatchRequest request) {
        return plannerService.patchTask(id, currentUser.getUserId(), request)
                .map(task -> ResponseEntity.ok(ApiResponse.success(task)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Task not found")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable String id) {
        plannerService.deleteTask(id, currentUser.getUserId());
        return ResponseEntity.ok(ApiResponse.message("Task deleted"));
    }
}
