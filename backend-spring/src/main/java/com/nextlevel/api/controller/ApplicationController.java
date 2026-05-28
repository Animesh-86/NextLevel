package com.nextlevel.api.controller;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
import com.nextlevel.api.model.Application;
import com.nextlevel.api.repository.ApplicationRepository;
import com.nextlevel.api.security.CurrentUser;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationRepository applicationRepository;

    public ApplicationController(ApplicationRepository applicationRepository) {
        this.applicationRepository = applicationRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Application>>> list(@AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String company) {
        List<Application> apps = applicationRepository.findByUserIdOrderByUpdatedAtDesc(currentUser.getUserId()).stream()
                .filter(a -> status == null || "all".equals(status) || status.equals(a.getStatus()))
                .filter(a -> company == null || contains(a.getCompany(), company))
                .toList();
        return ResponseEntity.ok(ApiResponse.success(apps));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Application>> create(@AuthenticationPrincipal CurrentUser currentUser,
            @RequestBody Map<String, Object> body) {
        if (body.get("company") == null || body.get("role") == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Company and role required"));
        }

        Application app = new Application();
        app.setUserId(currentUser.getUserId());
        app.setCompany(body.get("company").toString());
        app.setRole(body.get("role").toString());
        app.setType(strOr(body.get("type"), "full-time"));
        app.setStatus(strOr(body.get("status"), "bookmarked"));
        if (body.get("appliedDate") != null) app.setAppliedDate(Instant.parse(body.get("appliedDate").toString()));
        app.setSalary(strOr(body.get("salary"), ""));
        app.setLocation(strOr(body.get("location"), ""));
        app.setUrl(strOr(body.get("url"), ""));
        app.setNotes(strOr(body.get("notes"), ""));
        app.setLinkedFileId(strOr(body.get("linkedFileId"), null));
        app.setCreatedAt(Instant.now());
        app.setUpdatedAt(Instant.now());

        Application.TimelineEntry entry = new Application.TimelineEntry();
        entry.setEvent("applied".equals(app.getStatus()) ? "Applied" : "Bookmarked");
        entry.setDate(Instant.now());
        app.setTimeline(List.of(entry));

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(applicationRepository.save(app)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<Application>> patch(@AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        Application app = applicationRepository.findByIdAndUserId(id, currentUser.getUserId()).orElse(null);
        if (app == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Not found"));

        if (body.get("status") != null && !body.get("status").toString().equals(app.getStatus())) {
            Application.TimelineEntry entry = new Application.TimelineEntry();
            entry.setEvent(statusLabel(body.get("status").toString()));
            entry.setDate(Instant.now());
            app.getTimeline().add(entry);
        }

        if (body.get("addEvent") instanceof Map<?, ?> eventObj) {
            @SuppressWarnings("unchecked")
            Map<String, Object> ev = (Map<String, Object>) eventObj;
            Application.TimelineEntry entry = new Application.TimelineEntry();
            entry.setEvent(strOr(ev.get("event"), "Update"));
            entry.setNotes(strOr(ev.get("notes"), ""));
            entry.setDate(Instant.now());
            app.getTimeline().add(entry);
        }

        if (body.containsKey("company")) app.setCompany(strOr(body.get("company"), app.getCompany()));
        if (body.containsKey("role")) app.setRole(strOr(body.get("role"), app.getRole()));
        if (body.containsKey("type")) app.setType(strOr(body.get("type"), app.getType()));
        if (body.containsKey("status")) app.setStatus(strOr(body.get("status"), app.getStatus()));
        if (body.containsKey("salary")) app.setSalary(strOr(body.get("salary"), app.getSalary()));
        if (body.containsKey("location")) app.setLocation(strOr(body.get("location"), app.getLocation()));
        if (body.containsKey("url")) app.setUrl(strOr(body.get("url"), app.getUrl()));
        if (body.containsKey("notes")) app.setNotes(strOr(body.get("notes"), app.getNotes()));
        if (body.containsKey("linkedFileId")) app.setLinkedFileId(strOr(body.get("linkedFileId"), null));
        if (body.containsKey("appliedDate") && body.get("appliedDate") != null) app.setAppliedDate(Instant.parse(body.get("appliedDate").toString()));
        app.setUpdatedAt(Instant.now());

        return ResponseEntity.ok(ApiResponse.success(applicationRepository.save(app)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable String id) {
        Application app = applicationRepository.findByIdAndUserId(id, currentUser.getUserId()).orElse(null);
        if (app != null) applicationRepository.delete(app);
        return ResponseEntity.ok(ApiResponse.message("Deleted"));
    }

    private String statusLabel(String status) {
        return switch (status) {
            case "applied" -> "Applied";
            case "screening" -> "Phone Screening";
            case "technical" -> "Technical Round";
            case "onsite" -> "Onsite Interview";
            case "offer" -> "Received Offer!";
            case "accepted" -> "Accepted Offer!";
            case "rejected" -> "Rejected";
            case "ghosted" -> "No Response";
            default -> status;
        };
    }

    private String strOr(Object value, String fallback) { return value == null ? fallback : value.toString(); }
    private boolean contains(String src, String q) { return src != null && src.toLowerCase().contains(q.toLowerCase()); }
}
