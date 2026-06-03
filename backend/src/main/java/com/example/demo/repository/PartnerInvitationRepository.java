package com.example.demo.repository;

import com.example.demo.model.PartnerInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PartnerInvitationRepository extends JpaRepository<PartnerInvitation, Long> {
    List<PartnerInvitation> findByReceiverIdAndStatus(Long receiverId, PartnerInvitation.InvitationStatus status);
    List<PartnerInvitation> findBySenderIdAndStatus(Long senderId, PartnerInvitation.InvitationStatus status);
    Optional<PartnerInvitation> findBySenderIdAndReceiverIdAndStatus(Long senderId, Long receiverId, PartnerInvitation.InvitationStatus status);
}
