package com.example.notificationmessagingservice.client;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.service.annotation.GetExchange;
import org.springframework.web.service.annotation.HttpExchange;
import com.example.notificationmessagingservice.dto.response.external.UserResponse;
import com.example.notificationmessagingservice.dto.response.external.UsersResponse;

@HttpExchange
public interface UserClient {
    @GetExchange("/users/{id}")
    UserResponse getUserById(@PathVariable Long id);
    @GetExchange("/users/keycloak/{keycloakId}")
    UserResponse getUserByKeycloakId(@PathVariable String keycloakId);
    @GetExchange("/users")
    UsersResponse getAllUsers();
}
