package com.nextlevel.api.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.nextlevel.api.model.StudyRoom;

@Repository
public interface StudyRoomRepository extends MongoRepository<StudyRoom, String> {
    Optional<StudyRoom> findByRoomCode(String roomCode);
    List<StudyRoom> findByActiveTrueOrderByUpdatedAtDesc();
    List<StudyRoom> findByCategoryAndActiveTrueOrderByUpdatedAtDesc(String category);
}
