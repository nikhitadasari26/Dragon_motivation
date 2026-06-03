package com.example.demo.repository;

import com.example.demo.model.StarHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StarHistoryRepository extends JpaRepository<StarHistory, Long> {
    List<StarHistory> findByReceiverIdOrderByCreatedAtDesc(Long receiverId);
    List<StarHistory> findBySenderIdOrderByCreatedAtDesc(Long senderId);
    long countBySenderIdAndReceiverIdAndCreatedAtAfter(Long senderId, Long receiverId, LocalDateTime after);
}
