package com.example.demo.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendPasswordResetEmail(String to, String resetToken, String resetUrl) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("Reset Your Password - HAK Cinema");
            
            String emailBody = String.format(
                "Hello,\n\n" +
                "You have requested to reset your password for your HAK Cinema account.\n\n" +
                "Please click on the following link to reset your password:\n" +
                "%s\n\n" +
                "This link will expire in 15 minutes.\n\n" +
                "If you did not request a password reset, please ignore this email.\n\n" +
                "Best regards,\n" +
                "HAK Cinema Team",
                resetUrl
            );
            
            message.setText(emailBody);
            message.setFrom("noreply@hakcinema.com");
            
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Error sending email: " + e.getMessage());
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        }
    }

    public void sendPasswordResetSuccessEmail(String to) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("Password Reset Successful - HAK Cinema");
            
            String emailBody = String.format(
                "Hello,\n\n" +
                "Your password has been successfully reset.\n\n" +
                "If you did not make this change, please contact us immediately.\n\n" +
                "Best regards,\n" +
                "HAK Cinema Team"
            );
            
            message.setText(emailBody);
            message.setFrom("noreply@hakcinema.com");
            
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Error sending success email: " + e.getMessage());
        }
    }
}

