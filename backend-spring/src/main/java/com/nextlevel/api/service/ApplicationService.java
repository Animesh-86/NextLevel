package com.nextlevel.api.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.nextlevel.api.dto.ApplicationCreateRequest;
import com.nextlevel.api.dto.ApplicationPatchRequest;
import com.nextlevel.api.model.Application;
import com.nextlevel.api.repository.ApplicationRepository;

@Service
public class ApplicationService {

    private static final Logger log = LoggerFactory.getLogger(ApplicationService.class);
    private final ApplicationRepository applicationRepository;

    public ApplicationService(ApplicationRepository applicationRepository) {
        this.applicationRepository = applicationRepository;
    }

    public List<Application> listApplications(String userId, String status, String company) {
        log.info("Listing applications for user: {}, status: {}, company: {}", userId, status, company);
        return applicationRepository.findByUserIdOrderByUpdatedAtDesc(userId).stream()
                .filter(a -> status == null || "all".equals(status) || status.equals(a.getStatus()))
                .filter(a -> company == null || containsIgnoreCase(a.getCompany(), company))
                .toList();
    }

    public Application createApplication(String userId, ApplicationCreateRequest request) {
        log.info("Creating application for user: {}", userId);
        Application app = new Application();
        app.setUserId(userId);
        app.setCompany(request.company());
        app.setRole(request.role());
        app.setType(request.type() != null ? request.type() : "full-time");
        app.setStatus(request.status() != null ? request.status() : "bookmarked");
        app.setAppliedDate(request.appliedDate());
        app.setYear(request.year() != null ? request.year() : "");
        app.setSalary(request.salary() != null ? request.salary() : "");
        app.setLocation(request.location() != null ? request.location() : "");
        app.setUrl(request.url() != null ? request.url() : "");
        app.setNotes(request.notes() != null ? request.notes() : "");
        app.setLinkedFileId(request.linkedFileId());
        
        Instant now = Instant.now();
        app.setCreatedAt(now);
        app.setUpdatedAt(now);

        Application.TimelineEntry entry = new Application.TimelineEntry();
        entry.setEvent("applied".equals(app.getStatus()) ? "Applied" : "Bookmarked");
        entry.setDate(now);
        
        List<Application.TimelineEntry> timeline = new ArrayList<>();
        timeline.add(entry);
        app.setTimeline(timeline);

        return applicationRepository.save(app);
    }

    public Optional<Application> patchApplication(String id, String userId, ApplicationPatchRequest request) {
        log.info("Patching application {} for user {}", id, userId);
        return applicationRepository.findByIdAndUserId(id, userId).map(app -> {
            if (request.status() != null && !request.status().equals(app.getStatus())) {
                Application.TimelineEntry entry = new Application.TimelineEntry();
                entry.setEvent(statusLabel(request.status()));
                entry.setDate(Instant.now());
                if (app.getTimeline() == null) app.setTimeline(new ArrayList<>());
                app.getTimeline().add(entry);
            }

            if (request.addEvent() != null) {
                Application.TimelineEntry entry = new Application.TimelineEntry();
                entry.setEvent(request.addEvent().event() != null ? request.addEvent().event() : "Update");
                entry.setNotes(request.addEvent().notes() != null ? request.addEvent().notes() : "");
                entry.setDate(Instant.now());
                if (app.getTimeline() == null) app.setTimeline(new ArrayList<>());
                app.getTimeline().add(entry);
            }

            if (request.company() != null) app.setCompany(request.company());
            if (request.role() != null) app.setRole(request.role());
            if (request.type() != null) app.setType(request.type());
            if (request.status() != null) app.setStatus(request.status());
            if (request.year() != null) app.setYear(request.year());
            if (request.salary() != null) app.setSalary(request.salary());
            if (request.location() != null) app.setLocation(request.location());
            if (request.url() != null) app.setUrl(request.url());
            if (request.notes() != null) app.setNotes(request.notes());
            if (request.linkedFileId() != null) app.setLinkedFileId(request.linkedFileId());
            if (request.appliedDate() != null) app.setAppliedDate(request.appliedDate());
            
            app.setUpdatedAt(Instant.now());
            return applicationRepository.save(app);
        });
    }

    public void deleteApplication(String id, String userId) {
        log.info("Deleting application {} for user {}", id, userId);
        applicationRepository.findByIdAndUserId(id, userId).ifPresent(applicationRepository::delete);
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

    private boolean containsIgnoreCase(String src, String q) {
        return src != null && src.toLowerCase().contains(q.toLowerCase());
    }
}
