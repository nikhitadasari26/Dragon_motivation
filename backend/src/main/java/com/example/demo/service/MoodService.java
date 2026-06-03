package com.example.demo.service;

import com.example.demo.model.Mood;
import com.example.demo.model.User;
import com.example.demo.repository.MoodRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class MoodService {

    private final MoodRepository moodRepository;

    public MoodService(MoodRepository moodRepository) {
        this.moodRepository = moodRepository;
    }

    public Mood logMood(String moodTypeStr, String note, User user) {
        Mood.MoodType moodType;
        try {
            moodType = Mood.MoodType.valueOf(moodTypeStr.toUpperCase());
        } catch (Exception e) {
            moodType = Mood.MoodType.NORMAL;
        }

        Mood mood = new Mood();
        mood.setMoodType(moodType);
        mood.setNote(note);
        mood.setUser(user);
        mood.setCreatedAt(LocalDateTime.now());

        return moodRepository.save(mood);
    }

    public List<Mood> getMoodHistory(User user) {
        return moodRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    public Optional<Mood> getLatestMood(User user) {
        return moodRepository.findTopByUserIdOrderByCreatedAtDesc(user.getId());
    }
}
