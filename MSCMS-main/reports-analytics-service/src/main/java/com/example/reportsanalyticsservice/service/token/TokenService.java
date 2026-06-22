package com.example.reportsanalyticsservice.service.token;

import com.example.reportsanalyticsservice.dto.response.external.UserResponse;
import jakarta.servlet.http.HttpServletRequest;

public interface TokenService {
    String extractToken(HttpServletRequest request);
    String extractUserId(HttpServletRequest request);
    String extractUserRole(HttpServletRequest request);
    UserResponse getCurrentUser(HttpServletRequest request);
}
