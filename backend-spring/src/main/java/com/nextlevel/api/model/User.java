package com.nextlevel.api.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

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

    @NotBlank
    @Size(min = 6)
    private String password;

    private UserRole role = UserRole.student;
    private Integer streak = 0;
    private Instant lastActiveDate;
    private Integer totalStudyMinutes = 0;
    private Integer questionsAnswered = 0;
    private Instant createdAt;
    private Instant updatedAt;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public Integer getStreak() {
        return streak;
    }

    public void setStreak(Integer streak) {
        this.streak = streak;
    }

    public Instant getLastActiveDate() {
        return lastActiveDate;
    }

    public void setLastActiveDate(Instant lastActiveDate) {
        this.lastActiveDate = lastActiveDate;
    }

    public Integer getTotalStudyMinutes() {
        return totalStudyMinutes;
    }

    public void setTotalStudyMinutes(Integer totalStudyMinutes) {
        this.totalStudyMinutes = totalStudyMinutes;
    }

    public Integer getQuestionsAnswered() {
        return questionsAnswered;
    }

    public void setQuestionsAnswered(Integer questionsAnswered) {
        this.questionsAnswered = questionsAnswered;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
