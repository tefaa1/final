package com.example.trainingmatchservice.client;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.service.annotation.GetExchange;
import org.springframework.web.service.annotation.HttpExchange;
import com.example.trainingmatchservice.dto.response.external.UserResponse;

@HttpExchange
public interface UserClient {
    @GetExchange("/users/{id}")
    UserResponse getUserById(@PathVariable Long id);

    @GetExchange("/users/keycloak/{keycloakId}")
    UserResponse getUserByKeycloakId(@PathVariable String keycloakId);
}
