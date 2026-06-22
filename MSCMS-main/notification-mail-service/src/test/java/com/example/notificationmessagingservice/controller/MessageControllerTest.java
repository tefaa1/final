package com.example.notificationmessagingservice.controller;

import com.example.notificationmessagingservice.dto.request.MessageRequest;
import com.example.notificationmessagingservice.dto.response.MessageResponse;
import com.example.notificationmessagingservice.model.enums.MessageStatus;
import com.example.notificationmessagingservice.service.MessageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MessageControllerTest {

    @Mock
    private MessageService messageService;

    @InjectMocks
    private MessageController messageController;

    private MessageRequest messageRequest;
    private MessageResponse messageResponse;

    @BeforeEach
    void setUp() {
        messageRequest = new MessageRequest(
                "sender-keycloak-123",
                "recipient-keycloak-456",
                "Test Subject",
                "Test message content",
                MessageStatus.SENT,
                null);

        messageResponse = new MessageResponse(
                1L,
                "sender-keycloak-123",
                "recipient-keycloak-456",
                "Test Subject",
                "Test message content",
                MessageStatus.SENT,
                LocalDateTime.now(),
                null,
                null,
                null);
    }

    @Test
    void testCreate() {
        when(messageService.create(any(MessageRequest.class))).thenReturn(messageResponse);

        ResponseEntity<MessageResponse> response = messageController.create(messageRequest);

        assertNotNull(response);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals(messageResponse, response.getBody());
        verify(messageService, times(1)).create(any(MessageRequest.class));
    }

    @Test
    void testUpdate() {
        Long id = 1L;
        when(messageService.update(eq(id), any(MessageRequest.class))).thenReturn(messageResponse);

        ResponseEntity<MessageResponse> response = messageController.update(id, messageRequest);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(messageResponse, response.getBody());
        verify(messageService, times(1)).update(eq(id), any(MessageRequest.class));
    }

    @Test
    void testDelete() {
        Long id = 1L;
        doNothing().when(messageService).delete(id);

        ResponseEntity<Void> response = messageController.delete(id);

        assertNotNull(response);
        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(messageService, times(1)).delete(id);
    }

    @Test
    void testGetById() {
        Long id = 1L;
        when(messageService.getById(id)).thenReturn(messageResponse);

        ResponseEntity<MessageResponse> response = messageController.getById(id);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(messageResponse, response.getBody());
        verify(messageService, times(1)).getById(id);
    }

    @Test
    void testGetAll() {
        List<MessageResponse> messages = Arrays.asList(messageResponse);
        when(messageService.getAll()).thenReturn(messages);

        ResponseEntity<List<MessageResponse>> response = messageController.getAll();

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(messages, response.getBody());
        verify(messageService, times(1)).getAll();
    }

    @Test
    void testGetByRecipient() {
        String keycloakId = "recipient-keycloak-456";
        List<MessageResponse> messages = Arrays.asList(messageResponse);
        when(messageService.getByRecipient(keycloakId)).thenReturn(messages);

        ResponseEntity<List<MessageResponse>> response = messageController.getByRecipient(keycloakId);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(messages, response.getBody());
        verify(messageService, times(1)).getByRecipient(keycloakId);
    }

    @Test
    void testGetBySender() {
        String keycloakId = "sender-keycloak-123";
        List<MessageResponse> messages = Arrays.asList(messageResponse);
        when(messageService.getBySender(keycloakId)).thenReturn(messages);

        ResponseEntity<List<MessageResponse>> response = messageController.getBySender(keycloakId);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(messages, response.getBody());
        verify(messageService, times(1)).getBySender(keycloakId);
    }
}
