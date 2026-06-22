package com.example.notificationmessagingservice.service.email;

public interface EmailService {
    void sendEmail(String to, String subject, String message);
}
