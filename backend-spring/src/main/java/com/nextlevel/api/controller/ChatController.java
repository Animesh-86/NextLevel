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
    private final org.springframework.core.env.Environment env;

    public ChatController(ChatService chatService, org.springframework.core.env.Environment env) {
        this.chatService = chatService;
        this.env = env;
    }

    @GetMapping("/debug")
    public ResponseEntity<String> debugAuth(@AuthenticationPrincipal CurrentUser currentUser) {
        String key = env.getProperty("GROQ_API_KEY");
        String maskedKey = key != null && key.length() > 5 ? key.substring(0, 5) + "..." : "null";
        return ResponseEntity.ok("User: " + (currentUser != null ? currentUser.getUserId() : "null") + ", Key: " + maskedKey);
    }

    @org.springframework.web.bind.annotation.PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamChat(
            @AuthenticationPrincipal CurrentUser currentUser,
            @org.springframework.web.bind.annotation.RequestBody com.nextlevel.api.dto.ChatRequest request) {
        return chatService.streamChat(currentUser.getUserId(), request.getQuery(), request.getContext(), request.getHistory());
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
