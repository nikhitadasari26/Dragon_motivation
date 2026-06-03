package com.example.demo.controller;

import com.example.demo.model.Task;
import com.example.demo.model.User;
import com.example.demo.service.TaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public ResponseEntity<List<Task>> getTasks(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(taskService.getTasksForUser(user));
    }

    @PostMapping
    public ResponseEntity<Task> createTask(
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal User user
    ) {
        Task task = taskService.createTask(request.get("title"), request.get("description"), user);
        return ResponseEntity.ok(task);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Task> updateTask(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal User user
    ) {
        try {
            Task task = taskService.updateTask(id, request.get("title"), request.get("description"), user);
            return ResponseEntity.ok(task);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable Long id, @AuthenticationPrincipal User user) {
        try {
            taskService.deleteTask(id, user);
            return ResponseEntity.ok(Map.of("message", "Task deleted successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/toggle")
    public ResponseEntity<Task> toggleTask(@PathVariable Long id, @AuthenticationPrincipal User user) {
        try {
            Task task = taskService.toggleTaskCompletion(id, user);
            return ResponseEntity.ok(task);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
