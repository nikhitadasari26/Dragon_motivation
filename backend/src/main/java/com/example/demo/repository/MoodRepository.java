package com.example.demo.repository;

import com.example.demo.model.Mood;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MoodRepository extends JpaRepository<Mood, Long> {
    List<Mood> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Mood> findTopByUserIdOrderByCreatedAtDesc(Long userId);
}
