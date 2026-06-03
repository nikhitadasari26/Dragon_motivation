package com.example.demo.service;

import com.example.demo.model.Streak;
import com.example.demo.model.User;
import com.example.demo.repository.StreakRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@Transactional
public class StreakService {

    private final StreakRepository streakRepository;

    public StreakService(StreakRepository streakRepository) {
        this.streakRepository = streakRepository;
    }

    public void updateStreak(User user) {
        Optional<Streak> streakOpt = streakRepository.findByUserId(user.getId());
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = LocalDate.now();

        if (streakOpt.isEmpty()) {
            Streak streak = new Streak();
            streak.setUser(user);
            streak.setCurrentStreak(1);
            streak.setLongestStreak(1);
            streak.setLastActivityDate(now);
            streakRepository.save(streak);
        } else {
            Streak streak = streakOpt.get();
            if (streak.getLastActivityDate() == null) {
                streak.setCurrentStreak(1);
                streak.setLongestStreak(Math.max(streak.getLongestStreak(), 1));
                streak.setLastActivityDate(now);
                streakRepository.save(streak);
                return;
            }

            LocalDate lastDate = streak.getLastActivityDate().toLocalDate();

            if (lastDate.equals(today)) {
                // Already did an activity today, keep streak the same
                return;
            } else if (lastDate.equals(today.minusDays(1))) {
                // Continuous day, increment streak!
                int nextStreak = streak.getCurrentStreak() + 1;
                streak.setCurrentStreak(nextStreak);
                if (nextStreak > streak.getLongestStreak()) {
                    streak.setLongestStreak(nextStreak);
                }
            } else {
                // Gap in activity, reset current streak to 1
                streak.setCurrentStreak(1);
            }
            streak.setLastActivityDate(now);
            streakRepository.save(streak);
        }
    }

    public Streak getOrCreateDefaultStreak(User user) {
        return streakRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    Streak streak = new Streak();
                    streak.setUser(user);
                    streak.setCurrentStreak(0);
                    streak.setLongestStreak(0);
                    streak.setLastActivityDate(null);
                    return streakRepository.save(streak);
                });
    }

    public int getCurrentStreak(Long userId) {
        return streakRepository.findByUserId(userId)
                .map(Streak::getCurrentStreak)
                .orElse(0);
    }
}
