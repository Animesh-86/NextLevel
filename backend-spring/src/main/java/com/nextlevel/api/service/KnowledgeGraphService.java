package com.nextlevel.api.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.nextlevel.api.model.Capture;
import com.nextlevel.api.model.Roadmap;
import com.nextlevel.api.model.StudyFile;
import com.nextlevel.api.repository.CaptureRepository;
import com.nextlevel.api.repository.RoadmapRepository;
import com.nextlevel.api.repository.StudyFileRepository;

@Service
public class KnowledgeGraphService {

    private final CaptureRepository captureRepository;
    private final StudyFileRepository studyFileRepository;
    private final RoadmapRepository roadmapRepository;

    public KnowledgeGraphService(CaptureRepository captureRepository, StudyFileRepository studyFileRepository,
            RoadmapRepository roadmapRepository) {
        this.captureRepository = captureRepository;
        this.studyFileRepository = studyFileRepository;
        this.roadmapRepository = roadmapRepository;
    }

    public Map<String, Object> getGraphData(String userId) {
        List<Capture> captures = captureRepository.findByUserId(userId).stream()
                .filter(c -> !"archived".equals(c.getStatus()))
                .limit(100)
                .toList();
        List<StudyFile> files = studyFileRepository.findByUserId(userId).stream()
                .filter(f -> !Boolean.TRUE.equals(f.getIsArchived()))
                .limit(50)
                .toList();
        List<Roadmap> roadmaps = roadmapRepository.findByUserId(userId).stream()
                .filter(r -> !"archived".equals(r.getStatus()))
                .limit(50)
                .toList();

        List<Map<String, Object>> nodes = new ArrayList<>();
        List<Map<String, Object>> links = new ArrayList<>();

        // Add Nodes
        for (Capture c : captures) {
            nodes.add(Map.of(
                    "id", "capture_" + c.getId(),
                    "name", c.getTitle() != null ? c.getTitle() : "Capture",
                    "type", "capture",
                    "val", 3,
                    "category", c.getCategory()
            ));
        }

        for (StudyFile f : files) {
            nodes.add(Map.of(
                    "id", "file_" + f.getId(),
                    "name", f.getFileName() != null ? f.getFileName() : "File",
                    "type", "file",
                    "val", 5,
                    "category", f.getCategory()
            ));
        }

        for (Roadmap r : roadmaps) {
            nodes.add(Map.of(
                    "id", "roadmap_" + r.getId(),
                    "name", r.getTitle() != null ? r.getTitle() : "Roadmap",
                    "type", "roadmap",
                    "val", 8,
                    "category", r.getCategory()
            ));
        }

        // Add Edges: Semantic similarity between captures
        for (int i = 0; i < captures.size(); i++) {
            Capture c1 = captures.get(i);
            for (int j = i + 1; j < captures.size(); j++) {
                Capture c2 = captures.get(j);
                if (c1.getEmbedding() != null && !c1.getEmbedding().isEmpty() &&
                    c2.getEmbedding() != null && !c2.getEmbedding().isEmpty()) {
                    
                    double sim = cosineSimilarity(c1.getEmbedding(), c2.getEmbedding());
                    if (sim > 0.75) {
                        links.add(Map.of(
                                "source", "capture_" + c1.getId(),
                                "target", "capture_" + c2.getId(),
                                "strength", sim,
                                "type", "semantic"
                        ));
                    }
                } else {
                    // Fallback to shared tags
                    Set<String> t1 = Set.copyOf(c1.getTags() != null ? c1.getTags() : List.of());
                    Set<String> t2 = Set.copyOf(c2.getTags() != null ? c2.getTags() : List.of());
                    t1.retainAll(t2);
                    if (!t1.isEmpty()) {
                        links.add(Map.of(
                                "source", "capture_" + c1.getId(),
                                "target", "capture_" + c2.getId(),
                                "strength", 0.5,
                                "type", "tag"
                        ));
                    }
                }
            }
        }

        // Edges between files and captures (shared category)
        for (StudyFile f : files) {
            for (Capture c : captures) {
                if (f.getCategory() != null && !"other".equals(f.getCategory()) && 
                    f.getCategory().equals(c.getCategory())) {
                    links.add(Map.of(
                            "source", "file_" + f.getId(),
                            "target", "capture_" + c.getId(),
                            "strength", 0.6,
                            "type", "category"
                    ));
                }
            }
            // Edges between files and roadmaps
            for (Roadmap r : roadmaps) {
                if (f.getCategory() != null && !"other".equals(f.getCategory()) && 
                    f.getCategory().equals(r.getCategory())) {
                    links.add(Map.of(
                            "source", "file_" + f.getId(),
                            "target", "roadmap_" + r.getId(),
                            "strength", 0.6,
                            "type", "category"
                    ));
                }
            }
        }

        // Edges between roadmaps and captures
        for (Roadmap r : roadmaps) {
            for (Capture c : captures) {
                if (r.getCategory() != null && !"other".equals(r.getCategory()) && 
                    r.getCategory().equals(c.getCategory())) {
                    links.add(Map.of(
                            "source", "roadmap_" + r.getId(),
                            "target", "capture_" + c.getId(),
                            "strength", 0.6,
                            "type", "category"
                    ));
                }
            }
        }

        Map<String, Object> graph = new HashMap<>();
        graph.put("nodes", nodes);
        graph.put("links", links);
        return graph;
    }

    public List<Map<String, Object>> getRelatedItems(String userId, String itemId, String type) {
        List<Map<String, Object>> related = new ArrayList<>();
        
        List<Capture> captures = captureRepository.findByUserId(userId).stream()
                .filter(c -> !"archived".equals(c.getStatus()))
                .limit(100)
                .toList();
        List<StudyFile> files = studyFileRepository.findByUserId(userId).stream()
                .filter(f -> !Boolean.TRUE.equals(f.getIsArchived()))
                .limit(50)
                .toList();
        List<Roadmap> roadmaps = roadmapRepository.findByUserId(userId).stream()
                .filter(r -> !"archived".equals(r.getStatus()))
                .limit(50)
                .toList();

        if ("capture".equals(type)) {
            Capture target = captures.stream().filter(c -> c.getId().equals(itemId)).findFirst().orElse(null);
            if (target == null) return related;
            
            // Related Captures
            for (Capture c : captures) {
                if (c.getId().equals(itemId)) continue;
                if (target.getEmbedding() != null && !target.getEmbedding().isEmpty() &&
                    c.getEmbedding() != null && !c.getEmbedding().isEmpty()) {
                    double sim = cosineSimilarity(target.getEmbedding(), c.getEmbedding());
                    if (sim > 0.75) {
                        related.add(Map.of("id", c.getId(), "title", c.getTitle(), "type", "capture", "score", sim));
                    }
                } else {
                    Set<String> t1 = Set.copyOf(target.getTags() != null ? target.getTags() : List.of());
                    Set<String> t2 = Set.copyOf(c.getTags() != null ? c.getTags() : List.of());
                    t1.retainAll(t2);
                    if (!t1.isEmpty()) {
                        related.add(Map.of("id", c.getId(), "title", c.getTitle(), "type", "capture", "score", 0.5));
                    }
                }
            }
            
            // Related Files
            for (StudyFile f : files) {
                if (f.getCategory() != null && !"other".equals(f.getCategory()) && f.getCategory().equals(target.getCategory())) {
                    related.add(Map.of("id", f.getId(), "title", f.getFileName(), "type", "file", "score", 0.6));
                }
            }
            
            // Related Roadmaps
            for (Roadmap r : roadmaps) {
                if (r.getCategory() != null && !"other".equals(r.getCategory()) && r.getCategory().equals(target.getCategory())) {
                    related.add(Map.of("id", r.getId(), "title", r.getTitle(), "type", "roadmap", "score", 0.6));
                }
            }
        }
        
        // Sort by score descending and limit to top 5
        return related.stream()
            .sorted((a, b) -> Double.compare((double) b.get("score"), (double) a.get("score")))
            .limit(5)
            .toList();
    }

    private double cosineSimilarity(List<Double> v1, List<Double> v2) {
        if (v1.size() != v2.size()) return 0.0;
        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;
        for (int i = 0; i < v1.size(); i++) {
            dotProduct += v1.get(i) * v2.get(i);
            normA += Math.pow(v1.get(i), 2);
            normB += Math.pow(v2.get(i), 2);
        }
        if (normA == 0.0 || normB == 0.0) return 0.0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
