package com.nextlevel.api.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.nextlevel.api.dto.ApiResponse;
import com.nextlevel.api.model.Capture;
import com.nextlevel.api.security.CurrentUser;
import com.nextlevel.api.service.ChatService;

import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamChat(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam String query,
            @RequestParam(required = false) String context) {
        return chatService.streamChat(currentUser.getUserId(), query, context);
    }
    
    @GetMapping("/sources")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getSources(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam String query) {
        List<Capture> sources = chatService.getChatSources(currentUser.getUserId(), query);
        var mapped = sources.stream().map(c -> Map.<String, Object>of(
            "id", c.getId(),
            "title", c.getTitle(),
            "category", c.getCategory(),
            "score", c.getEmbedding() != null ? 0.9 : 0.5 // Rough fallback score for UI
        )).toList();
        return ResponseEntity.ok(ApiResponse.success(mapped));
    }
}
