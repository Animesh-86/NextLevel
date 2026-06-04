package com.nextlevel.api.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationOperation;
import org.springframework.data.mongodb.core.aggregation.AggregationOperationContext;
import org.springframework.stereotype.Service;

import com.nextlevel.api.model.Capture;

@Service
public class SemanticSearchService {

    private final MongoTemplate mongoTemplate;
    private final GeminiService geminiService;

    public SemanticSearchService(MongoTemplate mongoTemplate, GeminiService geminiService) {
        this.mongoTemplate = mongoTemplate;
        this.geminiService = geminiService;
    }

    public List<Capture> search(String userId, String query) {
        List<Double> embedding = geminiService.generateEmbeddings(query);
        if (embedding == null || embedding.isEmpty()) {
            return keywordFallback(userId, query);
        }

        try {
            Aggregation aggregation = Aggregation.newAggregation(
                    vectorSearchStage(embedding),
                    rawMatch(userId),
                    rawProject());

            List<Capture> results = mongoTemplate.aggregate(aggregation, "captures", Capture.class)
                    .getMappedResults();

            if (results == null || results.isEmpty()) {
                return keywordFallback(userId, query);
            }
            return results;
        } catch (Exception ex) {
            return keywordFallback(userId, query);
        }
    }

    private AggregationOperation vectorSearchStage(List<Double> embedding) {
        return new AggregationOperation() {
            @Override
            public Document toDocument(AggregationOperationContext context) {
                Map<String, Object> vectorSearch = new HashMap<>();
                vectorSearch.put("index", geminiService.getVectorIndex());
                vectorSearch.put("path", "embedding");
                vectorSearch.put("queryVector", embedding);
                vectorSearch.put("numCandidates", 100);
                vectorSearch.put("limit", 10);
                return new Document("$vectorSearch", new Document(vectorSearch));
            }
        };
    }

    private AggregationOperation rawMatch(String userId) {
        return context -> new Document("$match", new Document("userId", userId).append("status", new Document("$ne", "archived")));
    }

    private AggregationOperation rawProject() {
        return context -> new Document("$project", new Document("embedding", 0).append("score", new Document("$meta", "vectorSearchScore")));
    }

    private List<Capture> keywordFallback(String userId, String query) {
        String quotedQuery = Pattern.quote(query);
        List<Capture> captures = mongoTemplate.find(
                org.springframework.data.mongodb.core.query.Query.query(
                        org.springframework.data.mongodb.core.query.Criteria.where("userId").is(userId)
                                .and("status").ne("archived")
                                .orOperator(
                                        org.springframework.data.mongodb.core.query.Criteria.where("title").regex(quotedQuery, "i"),
                                        org.springframework.data.mongodb.core.query.Criteria.where("description").regex(quotedQuery, "i"),
                                        org.springframework.data.mongodb.core.query.Criteria.where("rawContent").regex(quotedQuery, "i"),
                                        org.springframework.data.mongodb.core.query.Criteria.where("tags").regex(quotedQuery, "i"))),
                Capture.class);

        List<Capture> limited = new ArrayList<>(captures.stream()
                .sorted(Comparator.comparing(Capture::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .limit(10)
                .toList());

        for (Capture capture : limited) {
            if (capture.getEmbedding() != null) {
                capture.setEmbedding(null);
            }
        }
        return limited;
    }
}