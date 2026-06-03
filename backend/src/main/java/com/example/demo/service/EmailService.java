package com.example.demo.service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@dragonmotivation.com}")
    private String fromEmail;

    public void sendVerificationEmail(String email, String nickname, String token) {
        String link = "http://localhost:3000/verify-email?token=" + token;
        
        // Print to console regardless for developer visibility
        printVerificationConsole(email, nickname, link);

        // If JavaMailSender is configured, send actual SMTP email
        if (mailSender != null) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                
                helper.setFrom(fromEmail);
                helper.setTo(email);
                helper.setSubject("Verify Your Dragon Motivation Account");
                
                String htmlContent = "<h3>Hello " + nickname + ",</h3>"
                        + "<p>Thank you for joining Dragon Motivation! Grow your companion dragon by hatching your egg.</p>"
                        + "<p>Please click the link below to verify your account and start your productivity adventure:</p>"
                        + "<p><a href=\"" + link + "\" style=\"display:inline-block; background-color:#6366f1; color:white; padding:10px 20px; text-decoration:none; border-radius:8px; font-weight:bold;\">Verify Account</a></p>"
                        + "<br/><p>If the button doesn't work, you can copy and paste this link: " + link + "</p>"
                        + "<br/><p>Best regards,<br/>The Dragon Companion Team</p>";
                
                helper.setText(htmlContent, true);
                mailSender.send(message);
                System.out.println("📬  [REAL EMAIL] Real verification email sent successfully to " + email);
            } catch (Exception e) {
                System.err.println("⚠️  Failed to send real verification email: " + e.getMessage());
            }
        }
    }

    public void sendPasswordResetEmail(String email, String nickname, String token) {
        String link = "http://localhost:3000/reset-password?token=" + token;
        
        // Print to console regardless for developer visibility
        printPasswordResetConsole(email, nickname, link);

        // If JavaMailSender is configured, send actual SMTP email
        if (mailSender != null) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                
                helper.setFrom(fromEmail);
                helper.setTo(email);
                helper.setSubject("Reset Your Dragon Motivation Password");
                
                String htmlContent = "<h3>Hello " + nickname + ",</h3>"
                        + "<p>We received a request to reset your Dragon Motivation account password.</p>"
                        + "<p>Please click the link below to securely reset your password:</p>"
                        + "<p><a href=\"" + link + "\" style=\"display:inline-block; background-color:#ef4444; color:white; padding:10px 20px; text-decoration:none; border-radius:8px; font-weight:bold;\">Reset Password</a></p>"
                        + "<br/><p>Note: This reset link is valid for 1 hour.</p>"
                        + "<p>If the button doesn't work, you can copy and paste this link: " + link + "</p>"
                        + "<br/><p>Best regards,<br/>The Dragon Companion Team</p>";
                
                helper.setText(htmlContent, true);
                mailSender.send(message);
                System.out.println("📬  [REAL EMAIL] Real password reset email sent successfully to " + email);
            } catch (Exception e) {
                System.err.println("⚠️  Failed to send real password reset email: " + e.getMessage());
            }
        }
    }

    private void printVerificationConsole(String email, String nickname, String link) {
        System.out.println("=========================================================================");
        System.out.println("✉️  [SIMULATED EMAIL] SENDING EMAIL VERIFICATION LINK");
        System.out.println("To: " + nickname + " <" + email + ">");
        System.out.println("Subject: Verify Your Dragon Motivation Account");
        System.out.println("-------------------------------------------------------------------------");
        System.out.println("Hello " + nickname + ",");
        System.out.println("Thank you for joining Dragon Motivation! Grow your companion dragon by");
        System.out.println("hatching your egg. Please click the link below to verify your account:");
        System.out.println("");
        System.out.println("👉 " + link);
        System.out.println("");
        System.out.println("If you did not sign up for this account, you can ignore this email.");
        System.out.println("=========================================================================");
    }

    private void printPasswordResetConsole(String email, String nickname, String link) {
        System.out.println("=========================================================================");
        System.out.println("✉️  [SIMULATED EMAIL] SENDING PASSWORD RESET LINK");
        System.out.println("To: " + nickname + " <" + email + ">");
        System.out.println("Subject: Reset Your Dragon Motivation Password");
        System.out.println("-------------------------------------------------------------------------");
        System.out.println("Hello " + nickname + ",");
        System.out.println("We received a request to reset your Dragon Motivation account password.");
        System.out.println("Click the link below to securely reset your password:");
        System.out.println("");
        System.out.println("👉 " + link);
        System.out.println("");
        System.out.println("Note: This reset link is valid for 1 hour.");
        System.out.println("If you did not request a password reset, please ignore this email.");
        System.out.println("=========================================================================");
    }
}
