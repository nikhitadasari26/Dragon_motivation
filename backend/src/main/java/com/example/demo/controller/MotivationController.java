package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.service.MotivationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/motivation")
public class MotivationController {

    private final MotivationService motivationService;

    public MotivationController(MotivationService motivationService) {
        this.motivationService = motivationService;
    }

    @PostMapping
    public ResponseEntity<?> getMotivation(
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal User user
    ) {
        String path = request.get("path"); // "continue" or "rest"
        if (path == null) {
            path = "continue";
        }
        
        Map<String, String> response = motivationService.generateMotivation(user, path);
        return ResponseEntity.ok(response);
    }
}
