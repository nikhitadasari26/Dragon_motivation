package com.example.demo.controller;

import com.example.demo.model.Mood;
import com.example.demo.model.User;
import com.example.demo.service.MoodService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mood")
public class MoodController {

    private final MoodService moodService;

    public MoodController(MoodService moodService) {
        this.moodService = moodService;
    }

    @PostMapping
    public ResponseEntity<Mood> logMood(
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal User user
    ) {
        Mood mood = moodService.logMood(request.get("mood"), request.get("note"), user);
        return ResponseEntity.ok(mood);
    }

    @GetMapping("/history")
    public ResponseEntity<List<Mood>> getHistory(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(moodService.getMoodHistory(user));
    }

    @GetMapping("/latest")
    public ResponseEntity<?> getLatest(@AuthenticationPrincipal User user) {
        return moodService.getLatestMood(user)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }
}
