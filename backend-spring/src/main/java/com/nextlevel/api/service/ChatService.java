package com.nextlevel.api.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.stereotype.Service;

import com.nextlevel.api.model.Capture;

import reactor.core.publisher.Flux;

@Service
public class ChatService {

    private final ChatClient chatClient;
    private final SemanticSearchService semanticSearchService;

    public ChatService(ChatModel chatModel, SemanticSearchService semanticSearchService) {
        this.chatClient = ChatClient.builder(chatModel).build();
        this.semanticSearchService = semanticSearchService;
    }

    public Flux<String> streamChat(String userId, String query) {
        // Retrieve context using existing semantic search
        List<Capture> relatedCaptures = semanticSearchService.search(userId, query);
        
        String contextText = relatedCaptures.stream()
                .limit(5)
                .map(c -> "Title: " + c.getTitle() + "\nCategory: " + c.getCategory() + "\nContent: " + 
                        (c.getDescription() != null && !c.getDescription().isEmpty() ? c.getDescription() : c.getRawContent()))
                .collect(Collectors.joining("\n\n---\n\n"));

        String systemPrompt = """
                You are NextLevel AI, a helpful knowledge assistant.
                You answer the user's questions based strictly on their personal knowledge base context provided below.
                If the context does not contain the answer, say "I couldn't find that in your knowledge base."
                Be concise, structured, and helpful.

                Context:
                """ + contextText;

        return chatClient.prompt()
                .system(s -> s.text(systemPrompt))
                .user(u -> u.text(query))
                .stream()
                .content();
    }
    
    // Non-streaming version for getting the sources
    public List<Capture> getChatSources(String userId, String query) {
        return semanticSearchService.search(userId, query).stream().limit(5).toList();
    }
}
