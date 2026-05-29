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
import com.nextlevel.api.dto.LinkCreateRequest;
import com.nextlevel.api.dto.LinkPatchRequest;
import com.nextlevel.api.model.SavedLink;
import com.nextlevel.api.security.CurrentUser;
import com.nextlevel.api.service.LinkService;

@RestController
@RequestMapping("/api/links")
public class LinkController {

    private final LinkService linkService;

    public LinkController(LinkService linkService) {
        this.linkService = linkService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SavedLink>>> list(@AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(ApiResponse.success(linkService.listLinks(currentUser.getUserId(), category, search)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SavedLink>> create(@AuthenticationPrincipal CurrentUser currentUser,
            @Validated @RequestBody LinkCreateRequest request) {
        SavedLink link = linkService.createLink(currentUser.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(link));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<SavedLink>> update(@AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String id,
            @Validated @RequestBody LinkPatchRequest request) {
        return linkService.patchLink(id, currentUser.getUserId(), request)
                .map(link -> ResponseEntity.ok(ApiResponse.success(link)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Not found")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable String id) {
        linkService.deleteLink(id, currentUser.getUserId());
        return ResponseEntity.ok(ApiResponse.message("Deleted"));
    }
}
