package com.example.usermanagementservice.service;

import com.example.usermanagementservice.model.entity.User;
import com.example.usermanagementservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service("securityService")
@RequiredArgsConstructor
@Slf4j
public class SecurityService {

    private final UserRepository userRepository;

    /**
     * Checks if the currently authenticated user matches the given local DB user ID.
     */
    public boolean isCurrentUser(Long userId) {
        String keycloakId = getCurrentKeycloakId();
        if (keycloakId == null) return false;

        Optional<User> user = userRepository.findById(userId);
        return user.isPresent() && keycloakId.equals(user.get().getKeycloakId());
    }

    /**
     * Checks if the currently authenticated user matches the given Keycloak ID.
     */
    public boolean isCurrentUserByKeycloakId(String keycloakId) {
        String currentKeycloakId = getCurrentKeycloakId();
        return currentKeycloakId != null && currentKeycloakId.equals(keycloakId);
    }

    /**
     * Gets the Keycloak subject (user ID) from the current JWT token.
     */
    private String getCurrentKeycloakId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            return null;
        }

        if (auth.getPrincipal() instanceof Jwt jwt) {
            return jwt.getSubject();
        }

        return null;
    }
}
