package com.nextlevel.api.dto;

import java.util.List;
import java.util.Map;

public class ChatRequest {
    private String query;
    private String context;
    private List<Map<String, String>> history;

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }

    public String getContext() {
        return context;
    }

    public void setContext(String context) {
        this.context = context;
    }

    public List<Map<String, String>> getHistory() {
        return history;
    }

    public void setHistory(List<Map<String, String>> history) {
        this.history = history;
    }
}
