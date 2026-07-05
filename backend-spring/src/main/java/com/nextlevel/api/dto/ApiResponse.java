package com.nextlevel.api.dto;

import com.fasterxml.jackson.annotation.JsonView;
import com.nextlevel.api.model.Views;

public class ApiResponse<T> {

    @JsonView(Views.Public.class)
    private boolean success;
    
    @JsonView(Views.Public.class)
    private T data;
    
    @JsonView(Views.Public.class)
    private String error;
    
    @JsonView(Views.Public.class)
    private String message;

    public static <T> ApiResponse<T> success(T data) {
        ApiResponse<T> response = new ApiResponse<>();
        response.success = true;
        response.data = data;
        return response;
    }

    public static <T> ApiResponse<T> error(String error) {
        ApiResponse<T> response = new ApiResponse<>();
        response.success = false;
        response.error = error;
        return response;
    }

    public static <T> ApiResponse<T> message(String message) {
        ApiResponse<T> response = new ApiResponse<>();
        response.success = true;
        response.message = message;
        return response;
    }

    public boolean isSuccess() {
        return success;
    }

    public T getData() {
        return data;
    }

    public String getError() {
        return error;
    }

    public String getMessage() {
        return message;
    }
}
