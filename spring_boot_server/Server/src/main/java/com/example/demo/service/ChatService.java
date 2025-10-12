package com.example.demo.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.example.demo.model.ChatMessage;
import com.example.demo.repository.ChatMessageRepository;

@Service
public class ChatService {

    @Value("${openrouter.api.key}")
    private String apiKey;

    private final ChatMessageRepository chatRepo;
    private final RestTemplate restTemplate = new RestTemplate();

    public ChatService(ChatMessageRepository chatRepo) {
        this.chatRepo = chatRepo;
    }

    @SuppressWarnings({ "unchecked", "rawtypes", "UseSpecificCatch" })
    public String processUserMessage(String userMessage) {
        chatRepo.save(new ChatMessage("user", userMessage));

        try {
            String apiUrl = "https://openrouter.ai/api/v1/chat/completions";

            // Đúng format OpenRouter API
            Map<String, Object> systemMsg = Map.of(
                    "role", "system",
                    "content", "You are a friendly movie assistant. Please answer in English."
            );

            Map<String, Object> userMsg = Map.of(
                    "role", "user",
                    "content", userMessage
            );

            Map<String, Object> body = new HashMap<>();
            body.put("model", "gpt-3.5-turbo"); 
            body.put("messages", List.of(systemMsg, userMsg));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);
            headers.set("HTTP-Referer", "http://localhost:8080");
            headers.set("X-Title", "Movie Chat");

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.exchange(apiUrl, HttpMethod.POST, entity, Map.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                Map<String, Object> bodyMap = response.getBody();
                if (bodyMap != null && bodyMap.containsKey("choices")) {
                    List<Map<String, Object>> choices = (List<Map<String, Object>>) bodyMap.get("choices");
                    if (!choices.isEmpty()) {
                        Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                        String reply = (String) message.get("content");

                        chatRepo.save(new ChatMessage("bot", reply));
                        return reply;
                    }
                }
            }
        } catch (Exception e) {
            return "Sorry, there was an error processing your request.";
        }

        return "Sorry, I don't understand your question.";
    }

    public List<ChatMessage> getAllMessages() {
        return chatRepo.findAll();
    }
}
