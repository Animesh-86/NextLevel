package com.nextlevel.api.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import com.nextlevel.api.model.Capture;

public interface CaptureRepository extends MongoRepository<Capture, String> {

    Page<Capture> findByUserIdAndStatus(String userId, String status, Pageable pageable);

    Optional<Capture> findByIdAndUserId(String id, String userId);

    Optional<Capture> findByIdAndUserIdAndStatus(String id, String userId, String status);

    List<Capture> findTop10ByUserIdAndReminderAtLessThanEqualAndIsReminderDismissedAndStatusOrderByReminderAtAsc(
            String userId, Instant reminderAt, Boolean isReminderDismissed, String status);

    @Query("{ 'userId': ?0, 'reminderAt': { $gt: ?1, $lte: ?2 }, 'isReminderDismissed': ?3, 'status': ?4 }")
    List<Capture> findUpcomingReminders(
            String userId, Instant start, Instant end, Boolean isReminderDismissed, String status);

    long countByUserIdAndReminderAtLessThanEqualAndIsReminderDismissedAndStatus(
            String userId, Instant reminderAt, Boolean isReminderDismissed, String status);

    List<Capture> findByUserId(String userId);

    List<Capture> findByUserIdAndReminderAtBetweenAndStatus(String userId, Instant start, Instant end, String status);

    Optional<Capture> findByUserIdAndTitleAndRawContent(String userId, String title, String rawContent);
}

