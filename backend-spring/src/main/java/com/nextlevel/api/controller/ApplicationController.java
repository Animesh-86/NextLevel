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
import com.nextlevel.api.dto.ApplicationCreateRequest;
import com.nextlevel.api.dto.ApplicationPatchRequest;
import com.nextlevel.api.model.Application;
import com.nextlevel.api.security.CurrentUser;
import com.nextlevel.api.service.ApplicationService;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationService applicationService;

    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Application>>> list(@AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String company) {
        List<Application> apps = applicationService.listApplications(currentUser.getUserId(), status, company);
        return ResponseEntity.ok(ApiResponse.success(apps));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Application>> create(@AuthenticationPrincipal CurrentUser currentUser,
            @Validated @RequestBody ApplicationCreateRequest request) {
        Application app = applicationService.createApplication(currentUser.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(app));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<Application>> patch(@AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String id,
            @Validated @RequestBody ApplicationPatchRequest request) {
        return applicationService.patchApplication(id, currentUser.getUserId(), request)
                .map(app -> ResponseEntity.ok(ApiResponse.success(app)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Not found")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable String id) {
        applicationService.deleteApplication(id, currentUser.getUserId());
        return ResponseEntity.ok(ApiResponse.message("Deleted"));
    }
}
