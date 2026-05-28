package com.nextlevel.api.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class AiAnalysisResult {

    private String title;
    private String category;
    private String urgency;
    private List<String> tags = new ArrayList<>();
    private String reminderSuggestion;
    private String extractedLink;
    private String summary;
    private String extractedText;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getUrgency() {
        return urgency;
    }

    public void setUrgency(String urgency) {
        this.urgency = urgency;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags == null ? new ArrayList<>() : tags;
    }

    public String getReminderSuggestion() {
        return reminderSuggestion;
    }

    public void setReminderSuggestion(String reminderSuggestion) {
        this.reminderSuggestion = reminderSuggestion;
    }

    public String getExtractedLink() {
        return extractedLink;
    }

    public void setExtractedLink(String extractedLink) {
        this.extractedLink = extractedLink;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getExtractedText() {
        return extractedText;
    }

    public void setExtractedText(String extractedText) {
        this.extractedText = extractedText;
    }

    public Map<String, Object> toResponseMap() {
        Map<String, Object> data = new HashMap<>();
        data.put("title", title);
        data.put("category", category);
        data.put("urgency", urgency);
        data.put("tags", tags == null ? List.of() : tags);
        data.put("reminderSuggestion", reminderSuggestion);
        data.put("extractedLink", extractedLink);
        data.put("summary", summary);
        data.put("extractedText", extractedText);
        return data;
    }
}