package com.nextlevel.api.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Document(collection = "users")
public class User {

    @Id
    private String id;

    @NotBlank
    @Size(max = 60)
    private String name;

    @NotBlank
    @Email
    @Indexed(unique = true)
    private String email;

    private String password;

    private UserRole role = UserRole.student;
    private Integer streak = 0;
    private Instant lastActiveDate;
    private Integer totalStudyMinutes = 0;
    private Integer questionsAnswered = 0;
    private Instant createdAt;
    private Instant updatedAt;
}
