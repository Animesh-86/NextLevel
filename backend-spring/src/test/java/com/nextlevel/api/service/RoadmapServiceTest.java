package com.nextlevel.api.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import com.nextlevel.api.dto.RoadmapCreateRequest;
import com.nextlevel.api.model.Roadmap;
import com.nextlevel.api.repository.RoadmapRepository;

@ExtendWith(MockitoExtension.class)
class RoadmapServiceTest {

    @Mock
    private RoadmapRepository roadmapRepository;

    private RoadmapService roadmapService;

    @BeforeEach
    void setUp() {
        roadmapService = new RoadmapService(roadmapRepository);
    }

    @Test
    void testCreateRoadmap() {
        RoadmapCreateRequest req = new RoadmapCreateRequest("Test Roadmap", "Desc", "Java", null, "blue", null, 0);
        Roadmap saved = new Roadmap();
        saved.setId("r1");
        saved.setTitle("Test Roadmap");
        when(roadmapRepository.save(any(Roadmap.class))).thenReturn(saved);

        Roadmap result = roadmapService.createRoadmap("u1", req);
        assertNotNull(result);
        assertEquals("Test Roadmap", result.getTitle());
    }

    @Test
    void testGetRoadmapFound() {
        Roadmap r = new Roadmap();
        r.setId("r1");
        when(roadmapRepository.findByIdAndUserId("r1", "u1")).thenReturn(Optional.of(r));

        Optional<Roadmap> result = roadmapService.getRoadmap("r1", "u1");
        assertNotNull(result);
        assertTrue(result.isPresent());
        assertEquals("r1", result.get().getId());
    }

    @Test
    void testGetRoadmapNotFound() {
        when(roadmapRepository.findByIdAndUserId("r1", "u1")).thenReturn(Optional.empty());
        assertThrows(ResponseStatusException.class, () -> roadmapService.getRoadmap("r1", "u1"));
    }
}
