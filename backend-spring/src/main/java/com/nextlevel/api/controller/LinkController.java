package com.nextlevel.api.controller;

import java.net.URI;
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
import com.nextlevel.api.model.SavedLink;
import com.nextlevel.api.repository.SavedLinkRepository;
import com.nextlevel.api.security.CurrentUser;

@RestController
@RequestMapping("/api/links")
public class LinkController {

    private final SavedLinkRepository savedLinkRepository;

    public LinkController(SavedLinkRepository savedLinkRepository) {
        this.savedLinkRepository = savedLinkRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SavedLink>>> list(@AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search) {
        List<SavedLink> links = savedLinkRepository.findByUserIdAndIsArchivedNotOrderByIsPinnedDescCreatedAtDesc(currentUser.getUserId(), true)
                .stream()
                .filter(l -> category == null || "all".equals(category) || category.equals(l.getCategory()))
                .filter(l -> search == null || contains(l.getTitle(), search) || contains(l.getUrl(), search)
                        || (l.getTags() != null && l.getTags().stream().anyMatch(t -> contains(t, search))))
                .toList();
        return ResponseEntity.ok(ApiResponse.success(links));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SavedLink>> create(@AuthenticationPrincipal CurrentUser currentUser,
            @RequestBody Map<String, Object> body) {
        String url = str(body.get("url"));
        String title = str(body.get("title"));
        if (url == null || title == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("URL and title required"));
        }

        SavedLink link = new SavedLink();
        link.setUserId(currentUser.getUserId());
        link.setUrl(url);
        link.setTitle(title);
        link.setDescription(strOr(body.get("description"), ""));
        link.setCategory(strOr(body.get("category"), "other"));
        link.setTags(listOfString(body.get("tags")));
        link.setFavicon(faviconUrl(url));
        link.setCreatedAt(Instant.now());
        link.setUpdatedAt(Instant.now());

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(savedLinkRepository.save(link)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<SavedLink>> update(@AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        SavedLink link = savedLinkRepository.findByIdAndUserId(id, currentUser.getUserId()).orElse(null);
        if (link == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Not found"));

        if (body.containsKey("title")) link.setTitle(strOr(body.get("title"), link.getTitle()));
        if (body.containsKey("url")) link.setUrl(strOr(body.get("url"), link.getUrl()));
        if (body.containsKey("description")) link.setDescription(strOr(body.get("description"), link.getDescription()));
        if (body.containsKey("category")) link.setCategory(strOr(body.get("category"), link.getCategory()));
        if (body.containsKey("tags")) link.setTags(listOfString(body.get("tags")));
        if (body.containsKey("isPinned")) link.setIsPinned(boolOr(body.get("isPinned"), link.getIsPinned()));
        if (body.containsKey("isArchived")) link.setIsArchived(boolOr(body.get("isArchived"), link.getIsArchived()));
        link.setUpdatedAt(Instant.now());

        return ResponseEntity.ok(ApiResponse.success(savedLinkRepository.save(link)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable String id) {
        SavedLink link = savedLinkRepository.findByIdAndUserId(id, currentUser.getUserId()).orElse(null);
        if (link != null) savedLinkRepository.delete(link);
        return ResponseEntity.ok(ApiResponse.message("Deleted"));
    }

    private String faviconUrl(String rawUrl) {
        try {
            URI uri = URI.create(rawUrl);
            return "https://www.google.com/s2/favicons?domain=" + uri.getHost() + "&sz=32";
        } catch (Exception e) {
            return "";
        }
    }

    private List<String> listOfString(Object obj) {
        if (obj == null) return List.of();
        if (obj instanceof List<?> l) return l.stream().map(String::valueOf).toList();
        return List.of();
    }

    private String str(Object value) { return value == null ? null : value.toString(); }
    private String strOr(Object value, String fallback) { return value == null ? fallback : value.toString(); }
    private boolean contains(String src, String q) { return src != null && src.toLowerCase().contains(q.toLowerCase()); }
    private Boolean boolOr(Object value, Boolean fallback) {
        if (value == null) return fallback;
        if (value instanceof Boolean b) return b;
        String text = value.toString();
        return Boolean.parseBoolean(text);
    }
}
