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

    public Flux<String> streamChat(String userId, String query, String activeContext, List<java.util.Map<String, String>> history) {
        // Retrieve context using existing semantic search
        List<Capture> relatedCaptures = semanticSearchService.search(userId, query).stream().limit(5).toList();
        
        StringBuilder contextBuilder = new StringBuilder();
        for (int i = 0; i < relatedCaptures.size(); i++) {
            Capture c = relatedCaptures.get(i);
            contextBuilder.append("[").append(i + 1).append("] Title: ").append(c.getTitle())
                    .append("\nCategory: ").append(c.getCategory())
                    .append("\nContent: ").append(c.getDescription() != null && !c.getDescription().isEmpty() ? c.getDescription() : c.getRawContent())
                    .append("\n\n---\n\n");
        }

        String systemPrompt = """
                You are NextLevel AI, a helpful knowledge assistant and study copilot.
                You answer the user's questions based strictly on their personal knowledge base context provided below.
                If the context does not contain the answer, but the user is asking you to explain something, you may use your general knowledge, but prioritize the provided context.
                You MUST cite your sources using bracketed numbers corresponding to the source document (e.g., [1], [2]).
                Do not hallucinate information. Be concise, structured, and helpful.

                Context:
                """ + contextBuilder.toString();

        if (activeContext != null && !activeContext.isEmpty()) {
            systemPrompt = "The user is currently looking at the following page/context: " + activeContext + "\n\n" + systemPrompt;
        }

        final String finalSystemPrompt = systemPrompt;

        List<org.springframework.ai.chat.messages.Message> springMessages = new java.util.ArrayList<>();
        springMessages.add(new org.springframework.ai.chat.messages.SystemMessage(finalSystemPrompt));
        
        if (history != null) {
            for (java.util.Map<String, String> msg : history) {
                String role = msg.get("role");
                String content = msg.get("content");
                if (content == null || content.isEmpty()) continue;
                
                if ("user".equalsIgnoreCase(role)) {
                    springMessages.add(new org.springframework.ai.chat.messages.UserMessage(content));
                } else if ("bot".equalsIgnoreCase(role)) {
                    springMessages.add(new org.springframework.ai.chat.messages.AssistantMessage(content));
                }
            }
        }
        
        springMessages.add(new org.springframework.ai.chat.messages.UserMessage(query));

        return chatClient.prompt()
                .messages(springMessages)
                .stream()
                .content();
    }
    
    // Non-streaming version for getting the sources
    public List<Capture> getChatSources(String userId, String query) {
        return semanticSearchService.search(userId, query).stream().limit(5).toList();
    }
}
