package com.example.notificationmessagingservice.controller;

import com.example.notificationmessagingservice.dto.request.NotificationRequest;
import com.example.notificationmessagingservice.dto.response.NotificationResponse;
import com.example.notificationmessagingservice.model.enums.NotificationCategory;
import com.example.notificationmessagingservice.model.enums.NotificationStatus;
import com.example.notificationmessagingservice.model.enums.NotificationType;
import com.example.notificationmessagingservice.service.NotificationService;
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
class NotificationControllerTest {

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private NotificationController notificationController;

    private NotificationRequest notificationRequest;
    private NotificationResponse notificationResponse;

    @BeforeEach
    void setUp() {
        notificationRequest = new NotificationRequest(
                "user-keycloak-123",
                NotificationType.EMAIL,
                NotificationCategory.SYSTEM,
                NotificationStatus.PENDING,
                "Test Notification",
                "Test message content",
                "Test Email Subject",
                "Test email body",
                1L,
                "Player",
                "http://example.com/action"
        );

        notificationResponse = new NotificationResponse(
                1L,
                "user-keycloak-123",
                NotificationType.EMAIL,
                NotificationCategory.SYSTEM,
                NotificationStatus.PENDING,
                "Test Notification",
                "Test message content",
                "Test Email Subject",
                "Test email body",
                1L,
                "Player",
                LocalDateTime.now(),
                null,
                null,
                "http://example.com/action",
                false
        );
    }

    @Test
    void testCreate() {
        when(notificationService.create(any(NotificationRequest.class))).thenReturn(notificationResponse);

        ResponseEntity<NotificationResponse> response = notificationController.create(notificationRequest);

        assertNotNull(response);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals(notificationResponse, response.getBody());
        verify(notificationService, times(1)).create(any(NotificationRequest.class));
    }

    @Test
    void testUpdate() {
        Long id = 1L;
        when(notificationService.update(eq(id), any(NotificationRequest.class))).thenReturn(notificationResponse);

        ResponseEntity<NotificationResponse> response = notificationController.update(id, notificationRequest);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(notificationResponse, response.getBody());
        verify(notificationService, times(1)).update(eq(id), any(NotificationRequest.class));
    }

    @Test
    void testDelete() {
        Long id = 1L;
        doNothing().when(notificationService).delete(id);

        ResponseEntity<Void> response = notificationController.delete(id);

        assertNotNull(response);
        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(notificationService, times(1)).delete(id);
    }

    @Test
    void testGetById() {
        Long id = 1L;
        when(notificationService.getById(id)).thenReturn(notificationResponse);

        ResponseEntity<NotificationResponse> response = notificationController.getById(id);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(notificationResponse, response.getBody());
        verify(notificationService, times(1)).getById(id);
    }

    @Test
    void testGetAll() {
        List<NotificationResponse> notifications = Arrays.asList(notificationResponse);
        when(notificationService.getAll()).thenReturn(notifications);

        ResponseEntity<List<NotificationResponse>> response = notificationController.getAll();

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(notifications, response.getBody());
        verify(notificationService, times(1)).getAll();
    }

    @Test
    void testGetByRecipient() {
        String keycloakId = "user-keycloak-123";
        List<NotificationResponse> notifications = Arrays.asList(notificationResponse);
        when(notificationService.getByRecipient(keycloakId)).thenReturn(notifications);

        ResponseEntity<List<NotificationResponse>> response = notificationController.getByRecipient(keycloakId);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(notifications, response.getBody());
        verify(notificationService, times(1)).getByRecipient(keycloakId);
    }

    @Test
    void testGetUnreadByRecipient() {
        String keycloakId = "user-keycloak-123";
        List<NotificationResponse> notifications = Arrays.asList(notificationResponse);
        when(notificationService.getUnreadByRecipient(keycloakId)).thenReturn(notifications);

        ResponseEntity<List<NotificationResponse>> response = notificationController.getUnreadByRecipient(keycloakId);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(notifications, response.getBody());
        verify(notificationService, times(1)).getUnreadByRecipient(keycloakId);
    }

    @Test
    void testMarkAsRead() {
        Long id = 1L;
        NotificationResponse readNotification = new NotificationResponse(
                1L,
                "user-keycloak-123",
                NotificationType.EMAIL,
                NotificationCategory.SYSTEM,
                NotificationStatus.SENT,
                "Test Notification",
                "Test message content",
                "Test Email Subject",
                "Test email body",
                1L,
                "Player",
                LocalDateTime.now(),
                LocalDateTime.now(),
                LocalDateTime.now(),
                "http://example.com/action",
                true
        );
        when(notificationService.markAsRead(id)).thenReturn(readNotification);

        ResponseEntity<NotificationResponse> response = notificationController.markAsRead(id);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(readNotification, response.getBody());
        verify(notificationService, times(1)).markAsRead(id);
    }
}
