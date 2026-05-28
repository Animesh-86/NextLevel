package com.nextlevel.api.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import com.nextlevel.api.dto.ApiResponse;

@RestController
public class MiscController {

    @RequestMapping(value = "/api/inngest", method = { RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT })
    public ResponseEntity<ApiResponse<Map<String, Object>>> inngestPlaceholder() {
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "status", "placeholder",
                "message", "Inngest endpoint migrated as placeholder. Implement worker integration in Spring next.")));
    }
}
