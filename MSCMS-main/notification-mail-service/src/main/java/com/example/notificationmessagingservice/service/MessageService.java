package com.example.notificationmessagingservice.service;

import com.example.notificationmessagingservice.dto.request.MessageRequest;
import com.example.notificationmessagingservice.dto.response.MessageResponse;
import java.util.List;

public interface MessageService {
    MessageResponse create(MessageRequest request);
    MessageResponse update(Long id, MessageRequest request);
    void delete(Long id);
    MessageResponse getById(Long id);
    List<MessageResponse> getAll();
    List<MessageResponse> getByRecipient(String keycloakId);
    List<MessageResponse> getBySender(String keycloakId);
}
