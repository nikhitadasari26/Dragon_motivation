package com.example.demo.service;

import com.example.demo.config.JwtService;
import com.example.demo.model.User;
import com.example.demo.model.Streak;
import com.example.demo.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;
    private final StreakService streakService;

    @Value("${app.auth.require-email-verification:true}")
    private boolean requireEmailVerification;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager,
            EmailService emailService,
            StreakService streakService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.emailService = emailService;
        this.streakService = streakService;
    }

    public Map<String, Object> register(
            String username,
            String password,
            String email,
            String nickname,
            String avatar,
            String genderStr
    ) {
        if (userRepository.findByUsername(username).isPresent()) {
            throw new IllegalArgumentException("Username is already taken!");
        }
        String regEmail = (email != null) ? email.trim() : "";
        if (userRepository.findByEmailIgnoreCase(regEmail).isPresent()) {
            throw new IllegalArgumentException("Email is already registered!");
        }

        User.Gender gender;
        try {
            gender = User.Gender.valueOf(genderStr.toUpperCase());
        } catch (Exception e) {
            gender = User.Gender.OTHER;
        }

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setEmail(email);
        user.setNickname(nickname);
        user.setAvatar(avatar);
        user.setGender(gender);
        user.setStars(0);
        user.setDragonLevel(User.DragonLevel.EGG);
        user.setEmailVerified(!requireEmailVerification);
        
        String verificationToken = requireEmailVerification ? UUID.randomUUID().toString() : null;
        user.setVerificationToken(verificationToken);

        User savedUser = userRepository.save(user);

        if (requireEmailVerification) {
            // Send simulated email
            try {
                emailService.sendVerificationEmail(savedUser.getEmail(), savedUser.getNickname(), verificationToken);
            } catch (Exception e) {
                System.err.println("Failed to send simulated email: " + e.getMessage());
            }

            // Return profile but alert that verification is required
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Registration successful! Please verify your email first.");
            response.put("email", savedUser.getEmail());
            response.put("verified", false);
            return response;
        } else {
            // Auto-logged in!
            String token = jwtService.generateToken(savedUser);
            return createAuthResponse(token, savedUser);
        }
    }

    public Map<String, Object> login(String username, String password) {
        // Authenticate credentials
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password)
        );

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password!"));

        // Check if email is verified
        if (requireEmailVerification && !user.isEmailVerified()) {
            throw new IllegalArgumentException("UNVERIFIED:" + user.getEmail() + ":Please verify your email first! A verification link was sent to your email.");
        }

        String token = jwtService.generateToken(user);
        return createAuthResponse(token, user);
    }

    public void verifyEmail(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired verification token!"));

        user.setEmailVerified(true);
        user.setVerificationToken(null);
        userRepository.save(user);
    }

    public void resendVerification(String email) {
        String searchEmail = (email != null) ? email.trim() : "";
        User user = userRepository.findByEmailIgnoreCase(searchEmail)
                .orElseThrow(() -> new IllegalArgumentException("No user found with email: " + email));

        if (user.isEmailVerified()) {
            throw new IllegalArgumentException("Email is already verified!");
        }

        String verificationToken = UUID.randomUUID().toString();
        user.setVerificationToken(verificationToken);
        userRepository.save(user);

        emailService.sendVerificationEmail(user.getEmail(), user.getNickname(), verificationToken);
    }

    public void forgotPassword(String email) {
        String searchEmail = (email != null) ? email.trim() : "";
        User user = userRepository.findByEmailIgnoreCase(searchEmail)
                .orElseThrow(() -> new IllegalArgumentException("No account registered with this email address!"));

        String resetToken = UUID.randomUUID().toString();
        user.setResetToken(resetToken);
        user.setResetTokenExpiry(LocalDateTime.now().plusHours(1)); // 1 hour expiry
        userRepository.save(user);

        emailService.sendPasswordResetEmail(user.getEmail(), user.getNickname(), resetToken);
    }

    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByResetToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired password reset link!"));

        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("The password reset link has expired!");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }

    public Map<String, Object> getUserProfile(User user) {
        Map<String, Object> profile = new HashMap<>();
        profile.put("id", user.getId());
        profile.put("username", user.getUsername());
        profile.put("email", user.getEmail());
        profile.put("nickname", user.getNickname());
        profile.put("avatar", user.getAvatar());
        profile.put("gender", user.getGender().name());
        profile.put("stars", user.getStars());
        profile.put("dragonLevel", user.getDragonLevel().name());
        profile.put("partnerId", user.getPartnerId());
        profile.put("emailVerified", user.isEmailVerified());
        
        // XP and Streak stats
        profile.put("totalXp", user.getXp());
        Streak streak = streakService.getOrCreateDefaultStreak(user);
        profile.put("streak", streak.getCurrentStreak());
        profile.put("longestStreak", streak.getLongestStreak());
        
        return profile;
    }

    public Map<String, Object> getUserProfileById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found!"));
        return getUserProfile(user);
    }

    private Map<String, Object> createAuthResponse(String token, User user) {
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("user", getUserProfile(user));
        return response;
    }
}
