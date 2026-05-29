package com.nextlevel.api.service;

import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.nextlevel.api.dto.LinkCreateRequest;
import com.nextlevel.api.dto.LinkPatchRequest;
import com.nextlevel.api.model.SavedLink;
import com.nextlevel.api.repository.SavedLinkRepository;

@Service
public class LinkService {

    private static final Logger log = LoggerFactory.getLogger(LinkService.class);
    private final SavedLinkRepository savedLinkRepository;

    public LinkService(SavedLinkRepository savedLinkRepository) {
        this.savedLinkRepository = savedLinkRepository;
    }

    public List<SavedLink> listLinks(String userId, String category, String search) {
        log.info("Listing links for user: {}", userId);
        return savedLinkRepository.findByUserIdAndIsArchivedNotOrderByIsPinnedDescCreatedAtDesc(userId, true)
                .stream()
                .filter(l -> category == null || "all".equals(category) || category.equals(l.getCategory()))
                .filter(l -> search == null || containsIgnoreCase(l.getTitle(), search) || containsIgnoreCase(l.getUrl(), search)
                        || (l.getTags() != null && l.getTags().stream().anyMatch(t -> containsIgnoreCase(t, search))))
                .toList();
    }

    public SavedLink createLink(String userId, LinkCreateRequest request) {
        log.info("Creating link for user: {}", userId);
        SavedLink link = new SavedLink();
        link.setUserId(userId);
        link.setUrl(request.url());
        link.setTitle(request.title());
        link.setDescription(request.description() != null ? request.description() : "");
        link.setCategory(request.category() != null ? request.category() : "other");
        link.setTags(request.tags() != null ? request.tags() : List.of());
        link.setFavicon(faviconUrl(request.url()));
        link.setCreatedAt(Instant.now());
        link.setUpdatedAt(Instant.now());

        return savedLinkRepository.save(link);
    }

    public Optional<SavedLink> patchLink(String id, String userId, LinkPatchRequest request) {
        log.info("Patching link {} for user {}", id, userId);
        return savedLinkRepository.findByIdAndUserId(id, userId).map(link -> {
            if (request.title() != null) link.setTitle(request.title());
            if (request.url() != null) {
                link.setUrl(request.url());
                link.setFavicon(faviconUrl(request.url()));
            }
            if (request.description() != null) link.setDescription(request.description());
            if (request.category() != null) link.setCategory(request.category());
            if (request.tags() != null) link.setTags(request.tags());
            if (request.isPinned() != null) link.setIsPinned(request.isPinned());
            if (request.isArchived() != null) link.setIsArchived(request.isArchived());
            link.setUpdatedAt(Instant.now());
            return savedLinkRepository.save(link);
        });
    }

    public void deleteLink(String id, String userId) {
        log.info("Deleting link {} for user {}", id, userId);
        savedLinkRepository.findByIdAndUserId(id, userId).ifPresent(savedLinkRepository::delete);
    }

    private String faviconUrl(String rawUrl) {
        try {
            URI uri = URI.create(rawUrl);
            return "https://www.google.com/s2/favicons?domain=" + uri.getHost() + "&sz=32";
        } catch (Exception e) {
            return "";
        }
    }

    private boolean containsIgnoreCase(String src, String q) {
        return src != null && src.toLowerCase().contains(q.toLowerCase());
    }
}
