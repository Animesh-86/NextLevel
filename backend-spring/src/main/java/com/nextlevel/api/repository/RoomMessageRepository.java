package com.nextlevel.api.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.nextlevel.api.model.RoomMessage;

@Repository
public interface RoomMessageRepository extends MongoRepository<RoomMessage, String> {
    List<RoomMessage> findByRoomIdOrderByCreatedAtAsc(String roomId);
    List<RoomMessage> findTop50ByRoomIdOrderByCreatedAtDesc(String roomId);
}
