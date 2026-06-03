package com.example.demo.service;

import com.example.demo.model.PartnerInvitation;
import com.example.demo.model.StarHistory;
import com.example.demo.model.Task;
import com.example.demo.model.User;
import com.example.demo.repository.PartnerInvitationRepository;
import com.example.demo.repository.StarHistoryRepository;
import com.example.demo.repository.TaskRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
public class PartnerService {

    private final UserRepository userRepository;
    private final PartnerInvitationRepository invitationRepository;
    private final StarHistoryRepository starHistoryRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final AchievementService achievementService;
    private final TaskRepository taskRepository;

    public PartnerService(
            UserRepository userRepository,
            PartnerInvitationRepository invitationRepository,
            StarHistoryRepository starHistoryRepository,
            SimpMessagingTemplate messagingTemplate,
            AchievementService achievementService,
            TaskRepository taskRepository
    ) {
        this.userRepository = userRepository;
        this.invitationRepository = invitationRepository;
        this.starHistoryRepository = starHistoryRepository;
        this.messagingTemplate = messagingTemplate;
        this.achievementService = achievementService;
        this.taskRepository = taskRepository;
    }

    public PartnerInvitation invitePartner(String email, User sender) {
        if (sender.getPartnerId() != null) {
            throw new IllegalArgumentException("You already have an accountability partner!");
        }

        String searchEmail = (email != null) ? email.trim() : "";
        User receiver = userRepository.findByEmailIgnoreCase(searchEmail)
                .orElseThrow(() -> new IllegalArgumentException("No user found with email: " + email));

        if (receiver.getId().equals(sender.getId())) {
            throw new IllegalArgumentException("You cannot invite yourself!");
        }

        if (receiver.getPartnerId() != null) {
            throw new IllegalArgumentException("This user already has an accountability partner!");
        }

        // Check if invitation is already pending
        Optional<PartnerInvitation> existingOpt = invitationRepository
                .findBySenderIdAndReceiverIdAndStatus(sender.getId(), receiver.getId(), PartnerInvitation.InvitationStatus.PENDING);
        if (existingOpt.isPresent()) {
            throw new IllegalArgumentException("An invitation to this user is already pending!");
        }

        PartnerInvitation invitation = new PartnerInvitation();
        invitation.setSender(sender);
        invitation.setReceiver(receiver);
        invitation.setStatus(PartnerInvitation.InvitationStatus.PENDING);
        invitation.setCreatedAt(LocalDateTime.now());

        PartnerInvitation savedInvite = invitationRepository.save(invitation);

        // Send a live WebSocket notification to the receiver's private queue
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "PARTNER_INVITATION_RECEIVED");
            payload.put("invitationId", savedInvite.getId());
            payload.put("senderNickname", sender.getNickname());
            payload.put("senderEmail", sender.getEmail());

            messagingTemplate.convertAndSend((String) ("/topic/partner/" + receiver.getId()), (Object) payload);
        } catch (Exception e) {
            System.err.println("Failed to send invitation WS alert: " + e.getMessage());
        }

        return savedInvite;
    }

    public void acceptInvitation(Long invitationId, User receiver) {
        PartnerInvitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new IllegalArgumentException("Invitation not found!"));

        if (!invitation.getReceiver().getId().equals(receiver.getId())) {
            throw new SecurityException("Unauthorized action!");
        }

        if (invitation.getStatus() != PartnerInvitation.InvitationStatus.PENDING) {
            throw new IllegalArgumentException("Invitation is no longer pending!");
        }

        User sender = invitation.getSender();
        if (sender.getPartnerId() != null || receiver.getPartnerId() != null) {
            throw new IllegalArgumentException("One of the users already has a partner!");
        }

        invitation.setStatus(PartnerInvitation.InvitationStatus.ACCEPTED);
        invitationRepository.save(invitation);

        // Map them exclusively
        sender.setPartnerId(receiver.getId());
        receiver.setPartnerId(sender.getId());

        userRepository.save(sender);
        userRepository.save(receiver);

        // Broadcast to both partners that they are connected
        broadcastPartnerStatus(sender, receiver);
        broadcastPartnerStatus(receiver, sender);
    }

    public void rejectInvitation(Long invitationId, User receiver) {
        PartnerInvitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new IllegalArgumentException("Invitation not found!"));

        if (!invitation.getReceiver().getId().equals(receiver.getId())) {
            throw new SecurityException("Unauthorized action!");
        }

        invitation.setStatus(PartnerInvitation.InvitationStatus.REJECTED);
        invitationRepository.save(invitation);
    }

    public List<PartnerInvitation> getPendingInvitations(User user) {
        return invitationRepository.findByReceiverIdAndStatus(user.getId(), PartnerInvitation.InvitationStatus.PENDING);
    }

    public Map<String, Object> getPartnerDetails(User user) {
        if (user.getPartnerId() == null) {
            return null;
        }

        User partner = userRepository.findById(user.getPartnerId())
                .orElseThrow(() -> new IllegalArgumentException("Partner not found!"));

        Map<String, Object> details = new HashMap<>();
        details.put("id", partner.getId());
        details.put("nickname", partner.getNickname());
        details.put("avatar", partner.getAvatar());
        details.put("stars", partner.getStars());
        details.put("dragonLevel", partner.getDragonLevel().name());
        
        return details;
    }

    public void sendEncouragement(String message, User user) {
        if (user.getPartnerId() == null) {
            throw new IllegalArgumentException("You don't have an accountability partner!");
        }

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "PARTNER_ENCOURAGEMENT");
            payload.put("senderNickname", user.getNickname());
            payload.put("message", message);
            payload.put("timestamp", LocalDateTime.now().toString());

            messagingTemplate.convertAndSend((String) ("/topic/partner/" + user.getPartnerId()), (Object) payload);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send live encouragement!");
        }
    }

    public Map<String, Object> awardStar(Long taskId, String message, User partnerSender) {
        if (partnerSender.getPartnerId() == null) {
            throw new IllegalArgumentException("You don't have an accountability partner!");
        }

        User receiver = userRepository.findById(partnerSender.getPartnerId())
                .orElseThrow(() -> new IllegalArgumentException("Partner not found!"));

        if (taskId == null) {
            throw new IllegalArgumentException("A specific task ID must be selected to award a star!");
        }

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found!"));

        // Ensure the task belongs to the partner (receiver)
        if (!task.getUser().getId().equals(receiver.getId())) {
            throw new IllegalArgumentException("This task does not belong to your accountability partner!");
        }

        // Ensure the task is completed
        if (!task.isCompleted()) {
            throw new IllegalArgumentException("You cannot award a star for an uncompleted task!");
        }

        // Single-star check
        if (task.isStarAwarded()) {
            throw new IllegalArgumentException("A star has already been awarded for this task completion!");
        }

        // Star Limit Check: Maximum 6 stars per rolling 24 hours
        LocalDateTime oneDayAgo = LocalDateTime.now().minusDays(1);
        long count = starHistoryRepository.countBySenderIdAndReceiverIdAndCreatedAtAfter(
                partnerSender.getId(), receiver.getId(), oneDayAgo);
        
        if (count >= 6) {
            throw new IllegalArgumentException("Star limit reached! You can award a maximum of 6 stars to your partner per rolling 24 hours.");
        }

        // Mark the task as star awarded
        task.setStarAwarded(true);
        taskRepository.save(task);

        // Add star to receiver
        int currentStars = receiver.getStars() + 1;
        receiver.setStars(currentStars);

        // Update Dragon Growth Stage
        User.DragonLevel currentLevel = receiver.getDragonLevel();
        User.DragonLevel nextLevel = calculateDragonLevel(currentStars);
        boolean leveledUp = (currentLevel != nextLevel);
        receiver.setDragonLevel(nextLevel);

        User savedReceiver = userRepository.save(receiver);

        // Check & Award Achievements
        achievementService.checkAndAwardAchievements(savedReceiver);

        // Record History
        StarHistory history = new StarHistory();
        history.setSender(partnerSender);
        history.setReceiver(savedReceiver);
        history.setTaskId(taskId);
        history.setMessage(message);
        history.setCreatedAt(LocalDateTime.now());
        starHistoryRepository.save(history);

        // Notify Receiver live
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "STAR_RECEIVED");
            payload.put("senderNickname", partnerSender.getNickname());
            payload.put("totalStars", savedReceiver.getStars());
            payload.put("dragonLevel", savedReceiver.getDragonLevel().name());
            payload.put("leveledUp", leveledUp);
            payload.put("message", message);
            payload.put("timestamp", LocalDateTime.now().toString());

            messagingTemplate.convertAndSend((String) ("/topic/partner/" + receiver.getId()), (Object) payload);
        } catch (Exception e) {
            System.err.println("Failed to broadcast star received alert: " + e.getMessage());
        }

        Map<String, Object> result = new HashMap<>();
        result.put("totalStars", savedReceiver.getStars());
        result.put("dragonLevel", savedReceiver.getDragonLevel().name());
        result.put("leveledUp", leveledUp);
        return result;
    }

    public List<Task> getPartnerTasks(User user) {
        if (user.getPartnerId() == null) {
            throw new IllegalArgumentException("You don't have an accountability partner!");
        }
        return taskRepository.findByUserIdOrderByCreatedAtDesc(user.getPartnerId());
    }

    private User.DragonLevel calculateDragonLevel(int stars) {
        if (stars <= 5) return User.DragonLevel.EGG;
        if (stars <= 15) return User.DragonLevel.BABY;
        if (stars <= 35) return User.DragonLevel.YOUNG;
        if (stars <= 60) return User.DragonLevel.HERO;
        return User.DragonLevel.KING;
    }

    private void broadcastPartnerStatus(User user, User partner) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "PARTNER_CONNECTED");
            payload.put("partnerId", partner.getId());
            payload.put("partnerNickname", partner.getNickname());
            payload.put("partnerAvatar", partner.getAvatar());
            payload.put("partnerStars", partner.getStars());
            payload.put("partnerDragonLevel", partner.getDragonLevel().name());

            messagingTemplate.convertAndSend((String) ("/topic/partner/" + user.getId()), (Object) payload);
        } catch (Exception e) {
            System.err.println("Failed to broadcast partner connected status: " + e.getMessage());
        }
    }
}
