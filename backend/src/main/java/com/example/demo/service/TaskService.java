package com.example.demo.service;

import com.example.demo.model.Task;
import com.example.demo.model.User;
import com.example.demo.repository.TaskRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final StreakService streakService;
    private final AchievementService achievementService;

    public TaskService(
            TaskRepository taskRepository,
            UserRepository userRepository,
            SimpMessagingTemplate messagingTemplate,
            StreakService streakService,
            AchievementService achievementService
    ) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
        this.streakService = streakService;
        this.achievementService = achievementService;
    }

    public List<Task> getTasksForUser(User user) {
        return taskRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    public Task createTask(String title, String description, User user) {
        Task task = new Task();
        task.setTitle(title);
        task.setDescription(description);
        task.setUser(user);
        task.setCompleted(false);
        task.setCreatedAt(LocalDateTime.now());
        return taskRepository.save(task);
    }

    public Task updateTask(Long taskId, String title, String description, User user) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found!"));

        if (!task.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Unauthorized task access!");
        }

        task.setTitle(title);
        task.setDescription(description);
        return taskRepository.save(task);
    }

    public void deleteTask(Long taskId, User user) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found!"));

        if (!task.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Unauthorized task access!");
        }

        if (task.isStarAwarded()) {
            throw new IllegalArgumentException("Cannot delete a task once your partner has awarded a star!");
        }

        taskRepository.delete(task);
    }

    public Task toggleTaskCompletion(Long taskId, User user) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found!"));

        if (!task.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Unauthorized task access!");
        }

        if (task.isStarAwarded()) {
            throw new IllegalArgumentException("Cannot modify a task once your partner has awarded a star!");
        }

        boolean prevCompleted = task.isCompleted();
        task.setCompleted(!prevCompleted);

        // Load the actual user from db to update stars and level
        User dbUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found!"));

        if (task.isCompleted()) {
            task.setCompletedAt(LocalDateTime.now());
            
            // Cloud user upgrades: award +10 XP and update Streak
            dbUser.setXp(dbUser.getXp() + 10);
            try {
                streakService.updateStreak(dbUser);
            } catch (Exception e) {
                System.err.println("Failed to update streak record: " + e.getMessage());
            }

            // Check & Award Achievements
            try {
                achievementService.checkAndAwardAchievements(dbUser);
            } catch (Exception e) {
                System.err.println("Failed to check achievements: " + e.getMessage());
            }

            // Trigger WebSocket notification to accountability partner
            if (dbUser.getPartnerId() != null) {
                sendPartnerTaskNotification(dbUser, task);
            }
        } else {
            task.setCompletedAt(null);
            
            // Deduct XP on unchecking (optional, keeps score fair)
            dbUser.setXp(Math.max(0, dbUser.getXp() - 10));
        }

        userRepository.save(dbUser);
        return taskRepository.save(task);
    }

    private User.DragonLevel calculateDragonLevel(int stars) {
        if (stars <= 5) return User.DragonLevel.EGG;
        if (stars <= 15) return User.DragonLevel.BABY;
        if (stars <= 35) return User.DragonLevel.YOUNG;
        if (stars <= 60) return User.DragonLevel.HERO;
        return User.DragonLevel.KING;
    }

    private void sendPartnerTaskNotification(User user, Task task) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "PARTNER_TASK_COMPLETED");
            payload.put("partnerId", user.getId());
            payload.put("partnerNickname", user.getNickname());
            payload.put("taskId", task.getId());
            payload.put("taskTitle", task.getTitle());
            payload.put("timestamp", LocalDateTime.now().toString());

            // Broadcast to the partner's private channel /topic/partner/{partnerId}
            messagingTemplate.convertAndSend((String) ("/topic/partner/" + user.getPartnerId()), (Object) payload);
        } catch (Exception e) {
            System.err.println("Failed to send WebSocket task notification: " + e.getMessage());
        }
    }
}
