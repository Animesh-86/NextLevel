package com.nextlevel.api.service;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;

import com.nextlevel.api.dto.PostMessageRequest;
import com.nextlevel.api.model.RoomMessage;
import com.nextlevel.api.model.StudyRoom;
import com.nextlevel.api.repository.RoomMessageRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class StudyRoomMessageService {

    private final RoomMessageRepository roomMessageRepository;

    public RoomMessage postMessage(StudyRoom room, String userId, String displayName, PostMessageRequest req) {
        RoomMessage message = RoomMessage.builder()
                .roomId(room.getId())
                .userId(userId)
                .userName(displayName)
                .content(req.getContent())
                .type(req.getType() != null ? req.getType() : "CHAT")
                .metadata(req.getMetadata())
                .createdAt(Instant.now())
                .build();

        return roomMessageRepository.save(message);
    }

    public List<RoomMessage> getRoomMessages(String roomId) {
        return roomMessageRepository.findByRoomIdOrderByCreatedAtAsc(roomId);
    }

    public void saveSystemMessage(String roomId, String content) {
        RoomMessage msg = RoomMessage.builder()
                .roomId(roomId)
                .userId("system")
                .userName("System")
                .content(content)
                .type("SYSTEM")
                .createdAt(Instant.now())
                .build();
        roomMessageRepository.save(msg);
    }

    public void deleteAllForRoom(String roomId) {
        List<RoomMessage> msgs = roomMessageRepository.findByRoomIdOrderByCreatedAtAsc(roomId);
        if (!msgs.isEmpty()) {
            roomMessageRepository.deleteAll(msgs);
        }
    }

    public void clearAll() {
        roomMessageRepository.deleteAll();
    }
}
