package com.example.notificationmessagingservice.controller;

import com.example.notificationmessagingservice.dto.request.AlertRequest;
import com.example.notificationmessagingservice.dto.response.AlertResponse;
import com.example.notificationmessagingservice.model.enums.AlertPriority;
import com.example.notificationmessagingservice.model.enums.AlertType;
import com.example.notificationmessagingservice.service.AlertService;
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
class AlertControllerTest {

    @Mock
    private AlertService alertService;

    @InjectMocks
    private AlertController alertController;

    private AlertRequest alertRequest;
    private AlertResponse alertResponse;

    @BeforeEach
    void setUp() {
        alertRequest = new AlertRequest(
                AlertType.SYSTEM,
                AlertPriority.HIGH,
                "Test Alert",
                "Test alert message",
                "Detailed alert description",
                "user-keycloak-123",
                "ADMIN",
                1L,
                "Player",
                "Review required",
                "{\"key\":\"value\"}"
        );

        alertResponse = new AlertResponse(
                1L,
                AlertType.SYSTEM,
                AlertPriority.HIGH,
                "Test Alert",
                "Test alert message",
                "Detailed alert description",
                "user-keycloak-123",
                "ADMIN",
                1L,
                "Player",
                LocalDateTime.now(),
                null,
                null,
                false,
                false,
                null,
                "Review required",
                "{\"key\":\"value\"}"
        );
    }

    @Test
    void testCreate() {
        when(alertService.create(any(AlertRequest.class))).thenReturn(alertResponse);

        ResponseEntity<AlertResponse> response = alertController.create(alertRequest);

        assertNotNull(response);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals(alertResponse, response.getBody());
        verify(alertService, times(1)).create(any(AlertRequest.class));
    }

    @Test
    void testUpdate() {
        Long id = 1L;
        when(alertService.update(eq(id), any(AlertRequest.class))).thenReturn(alertResponse);

        ResponseEntity<AlertResponse> response = alertController.update(id, alertRequest);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(alertResponse, response.getBody());
        verify(alertService, times(1)).update(eq(id), any(AlertRequest.class));
    }

    @Test
    void testDelete() {
        Long id = 1L;
        doNothing().when(alertService).delete(id);

        ResponseEntity<Void> response = alertController.delete(id);

        assertNotNull(response);
        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(alertService, times(1)).delete(id);
    }

    @Test
    void testGetById() {
        Long id = 1L;
        when(alertService.getById(id)).thenReturn(alertResponse);

        ResponseEntity<AlertResponse> response = alertController.getById(id);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(alertResponse, response.getBody());
        verify(alertService, times(1)).getById(id);
    }

    @Test
    void testGetAll() {
        List<AlertResponse> alerts = Arrays.asList(alertResponse);
        when(alertService.getAll()).thenReturn(alerts);

        ResponseEntity<List<AlertResponse>> response = alertController.getAll();

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(alerts, response.getBody());
        verify(alertService, times(1)).getAll();
    }

    @Test
    void testGetByTarget() {
        String keycloakId = "user-keycloak-123";
        List<AlertResponse> alerts = Arrays.asList(alertResponse);
        when(alertService.getByTarget(keycloakId)).thenReturn(alerts);

        ResponseEntity<List<AlertResponse>> response = alertController.getByTarget(keycloakId);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(alerts, response.getBody());
        verify(alertService, times(1)).getByTarget(keycloakId);
    }

    @Test
    void testGetUnacknowledged() {
        List<AlertResponse> alerts = Arrays.asList(alertResponse);
        when(alertService.getUnacknowledged()).thenReturn(alerts);

        ResponseEntity<List<AlertResponse>> response = alertController.getUnacknowledged();

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(alerts, response.getBody());
        verify(alertService, times(1)).getUnacknowledged();
    }

    @Test
    void testAcknowledge() {
        Long id = 1L;
        String acknowledgedByKeycloakId = "admin-keycloak-456";
        AlertResponse acknowledgedAlert = new AlertResponse(
                1L,
                AlertType.SYSTEM,
                AlertPriority.HIGH,
                "Test Alert",
                "Test alert message",
                "Detailed alert description",
                "user-keycloak-123",
                "ADMIN",
                1L,
                "Player",
                LocalDateTime.now(),
                LocalDateTime.now(),
                acknowledgedByKeycloakId,
                true,
                false,
                null,
                "Review required",
                "{\"key\":\"value\"}"
        );
        when(alertService.acknowledge(id, acknowledgedByKeycloakId)).thenReturn(acknowledgedAlert);

        ResponseEntity<AlertResponse> response = alertController.acknowledge(id, acknowledgedByKeycloakId);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(acknowledgedAlert, response.getBody());
        verify(alertService, times(1)).acknowledge(id, acknowledgedByKeycloakId);
    }

    @Test
    void testResolve() {
        Long id = 1L;
        AlertResponse resolvedAlert = new AlertResponse(
                1L,
                AlertType.SYSTEM,
                AlertPriority.HIGH,
                "Test Alert",
                "Test alert message",
                "Detailed alert description",
                "user-keycloak-123",
                "ADMIN",
                1L,
                "Player",
                LocalDateTime.now(),
                LocalDateTime.now(),
                "admin-keycloak-456",
                true,
                true,
                LocalDateTime.now(),
                "Review required",
                "{\"key\":\"value\"}"
        );
        when(alertService.resolve(id)).thenReturn(resolvedAlert);

        ResponseEntity<AlertResponse> response = alertController.resolve(id);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(resolvedAlert, response.getBody());
        verify(alertService, times(1)).resolve(id);
    }
}
