package com.nextlevel.api.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String name;
    private String currentPassword;
    private String newPassword;
    private java.util.List<String> customCategories;
}
