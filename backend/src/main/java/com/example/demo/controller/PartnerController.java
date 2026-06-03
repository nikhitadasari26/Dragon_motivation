package com.example.demo.controller;

import com.example.demo.model.PartnerInvitation;
import com.example.demo.model.User;
import com.example.demo.service.PartnerService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/partner")
public class PartnerController {

    private final PartnerService partnerService;

    public PartnerController(PartnerService partnerService) {
        this.partnerService = partnerService;
    }

    @GetMapping
    public ResponseEntity<?> getPartner(@AuthenticationPrincipal User user) {
        Map<String, Object> details = partnerService.getPartnerDetails(user);
        if (details == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(details);
    }

    @PostMapping("/invite")
    public ResponseEntity<?> invite(
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal User user
    ) {
        try {
            PartnerInvitation invitation = partnerService.invitePartner(request.get("email"), user);
            return ResponseEntity.ok(Map.of(
                    "message", "Invitation sent successfully!",
                    "invitationId", invitation.getId()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/invitations")
    public ResponseEntity<List<PartnerInvitation>> getInvitations(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(partnerService.getPendingInvitations(user));
    }

    @PostMapping("/accept/{id}")
    public ResponseEntity<?> accept(@PathVariable Long id, @AuthenticationPrincipal User user) {
        try {
            partnerService.acceptInvitation(id, user);
            return ResponseEntity.ok(Map.of("message", "Invitation accepted! Partners connected."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/reject/{id}")
    public ResponseEntity<?> reject(@PathVariable Long id, @AuthenticationPrincipal User user) {
        try {
            partnerService.rejectInvitation(id, user);
            return ResponseEntity.ok(Map.of("message", "Invitation rejected successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/encourage")
    public ResponseEntity<?> encourage(
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal User user
    ) {
        try {
            partnerService.sendEncouragement(request.get("message"), user);
            return ResponseEntity.ok(Map.of("message", "Encouragement sent!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/tasks")
    public ResponseEntity<?> getPartnerTasks(@AuthenticationPrincipal User user) {
        try {
            return ResponseEntity.ok(partnerService.getPartnerTasks(user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/award-star")
    public ResponseEntity<?> awardStar(
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal User user
    ) {
        try {
            Object taskIdObj = request.get("taskId");
            Long taskId = (taskIdObj != null) ? Long.valueOf(taskIdObj.toString()) : null;
            String message = (String) request.get("message");

            Map<String, Object> result = partnerService.awardStar(taskId, message, user);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
