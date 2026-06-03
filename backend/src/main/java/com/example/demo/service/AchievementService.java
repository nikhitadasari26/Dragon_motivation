package com.example.demo.service;

import com.example.demo.model.Achievement;
import com.example.demo.model.User;
import com.example.demo.model.UserAchievement;
import com.example.demo.repository.AchievementRepository;
import com.example.demo.repository.UserAchievementRepository;
import com.example.demo.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional
public class AchievementService {

    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public AchievementService(
            AchievementRepository achievementRepository,
            UserAchievementRepository userAchievementRepository,
            UserRepository userRepository,
            SimpMessagingTemplate messagingTemplate
    ) {
        this.achievementRepository = achievementRepository;
        this.userAchievementRepository = userAchievementRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @PostConstruct
    public void seedAchievements() {
        if (achievementRepository.count() == 0) {
            saveAchievement("Hatching Out", "Hatch your companion egg into a Baby Dragon!", 6);
            saveAchievement("First Steps", "Grow your dragon into a Young Dragon!", 16);
            saveAchievement("Hero Ascension", "Grow your dragon into a Hero Dragon!", 36);
            saveAchievement("Draconic Royalty", "Evolve your dragon into the ultimate King Dragon!", 61);
            saveAchievement("Milestone Centurion", "Collect 100 golden stars overall!", 100);
            System.out.println("✨ Seeded default Achievements in the database.");
        }
    }

    private void saveAchievement(String name, String description, int requiredStars) {
        Achievement achievement = new Achievement();
        achievement.setName(name);
        achievement.setDescription(description);
        achievement.setRequiredStars(requiredStars);
        achievementRepository.save(achievement);
    }

    public void checkAndAwardAchievements(User user) {
        int stars = user.getStars();
        List<Achievement> achievements = achievementRepository.findAll();
        
        for (Achievement achievement : achievements) {
            if (stars >= achievement.getRequiredStars()) {
                Optional<UserAchievement> existing = userAchievementRepository
                        .findByUserIdAndAchievementId(user.getId(), achievement.getId());
                
                if (existing.isEmpty()) {
                    UserAchievement earned = new UserAchievement();
                    earned.setUser(user);
                    earned.setAchievement(achievement);
                    earned.setEarnedAt(LocalDateTime.now());
                    userAchievementRepository.save(earned);

                    // Broadcast real-time achievements earned via websockets
                    try {
                        Map<String, Object> payload = new HashMap<>();
                        payload.put("type", "ACHIEVEMENT_EARNED");
                        payload.put("achievementId", achievement.getId());
                        payload.put("name", achievement.getName());
                        payload.put("description", achievement.getDescription());
                        payload.put("earnedAt", earned.getEarnedAt().toString());

                        messagingTemplate.convertAndSend((String) ("/topic/partner/" + user.getId()), (Object) payload);
                    } catch (Exception e) {
                        System.err.println("Failed to broadcast achievement: " + e.getMessage());
                    }
                }
            }
        }
    }

    public List<Map<String, Object>> getUserAchievementsList(Long userId) {
        List<Achievement> allAchievements = achievementRepository.findAll();
        List<UserAchievement> earnedList = userAchievementRepository.findByUserId(userId);
        
        Set<Long> earnedIds = new HashSet<>();
        Map<Long, LocalDateTime> earnedDates = new HashMap<>();
        for (UserAchievement ua : earnedList) {
            earnedIds.add(ua.getAchievement().getId());
            earnedDates.put(ua.getAchievement().getId(), ua.getEarnedAt());
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Achievement a : allAchievements) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", a.getId());
            map.put("name", a.getName());
            map.put("description", a.getDescription());
            map.put("requiredStars", a.getRequiredStars());
            
            boolean earned = earnedIds.contains(a.getId());
            map.put("earned", earned);
            if (earned) {
                map.put("earnedAt", earnedDates.get(a.getId()).toString());
            }
            result.add(map);
        }
        return result;
    }
}
