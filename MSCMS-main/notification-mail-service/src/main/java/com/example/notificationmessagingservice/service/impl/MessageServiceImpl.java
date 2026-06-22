package com.example.notificationmessagingservice.service.impl;

import com.example.notificationmessagingservice.dto.request.MessageRequest;
import com.example.notificationmessagingservice.dto.response.MessageResponse;
import com.example.notificationmessagingservice.exception.custom.ResourceNotFoundException;
import com.example.notificationmessagingservice.mapper.MessageMapper;
import com.example.notificationmessagingservice.model.entity.Message;
import com.example.notificationmessagingservice.model.enums.MessageStatus;
import com.example.notificationmessagingservice.repository.MessageRepository;
import com.example.notificationmessagingservice.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final MessageMapper messageMapper;

    @Override
    @Transactional
    public MessageResponse create(MessageRequest request) {
        Message message = messageMapper.toEntity(request);
        message.setSentAt(LocalDateTime.now());
        if (message.getStatus() == null) {
            message.setStatus(MessageStatus.SENT);
        }
        if (request.parentMessageId() != null) {
            Message parentMessage = messageRepository.findById(request.parentMessageId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent message not found with id: " + request.parentMessageId()));
            message.setParentMessage(parentMessage);
        }
        return messageMapper.toResponse(messageRepository.save(message));
    }

    @Override
    @Transactional
    public MessageResponse update(Long id, MessageRequest request) {
        Message message = messageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found with id: " + id));
        messageMapper.updateFromRequest(request, message);
        if (request.parentMessageId() != null) {
            Message parentMessage = messageRepository.findById(request.parentMessageId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent message not found with id: " + request.parentMessageId()));
            message.setParentMessage(parentMessage);
        }
        return messageMapper.toResponse(messageRepository.save(message));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!messageRepository.existsById(id)) {
            throw new ResourceNotFoundException("Message not found with id: " + id);
        }
        messageRepository.deleteById(id);
    }

    @Override
    public MessageResponse getById(Long id) {
        return messageMapper.toResponse(messageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found with id: " + id)));
    }

    @Override
    public List<MessageResponse> getAll() {
        return messageRepository.findAll().stream()
                .map(messageMapper::toResponse)
                .toList();
    }

    @Override
    public List<MessageResponse> getByRecipient(String keycloakId) {
        return messageRepository.findByRecipientUserKeycloakId(keycloakId).stream()
                .map(messageMapper::toResponse)
                .toList();
    }

    @Override
    public List<MessageResponse> getBySender(String keycloakId) {
        return messageRepository.findBySenderUserKeycloakId(keycloakId).stream()
                .map(messageMapper::toResponse)
                .toList();
    }
}
