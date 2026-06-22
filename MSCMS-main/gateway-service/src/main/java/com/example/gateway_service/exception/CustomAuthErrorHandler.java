package com.example.gateway_service.exception;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
@Slf4j
public class CustomAuthErrorHandler implements AuthenticationEntryPoint, AccessDeniedHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
            AuthenticationException authException) throws IOException {
        log.warn("Authentication failed for {} {}: {}", request.getMethod(), request.getRequestURI(),
                authException.getMessage());

        String message;
        if (authException instanceof InvalidBearerTokenException) {
            message = "Invalid or expired JWT token. Please login again via POST /auth/login";
        } else if (authException instanceof InsufficientAuthenticationException) {
            message = "Authentication required. Please provide a valid JWT token in the Authorization header (Bearer <token>)";
        } else if (authException.getCause() instanceof JwtException) {
            message = "JWT token error: " + authException.getCause().getMessage();
        } else {
            message = "Authentication failed: " + authException.getMessage();
        }

        writeErrorResponse(response, HttpStatus.UNAUTHORIZED, message, request.getRequestURI());
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
            AccessDeniedException accessDeniedException) throws IOException {
        log.warn("Access denied for {} {}: {}", request.getMethod(), request.getRequestURI(),
                accessDeniedException.getMessage());

        String message = "Access denied. You don't have the required role to access " +
                request.getMethod() + " " + request.getRequestURI() +
                ". Check your user's roles in Keycloak.";

        writeErrorResponse(response, HttpStatus.FORBIDDEN, message, request.getRequestURI());
    }

    private void writeErrorResponse(HttpServletResponse response, HttpStatus status,
            String message, String path) throws IOException {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        body.put("path", path);

        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
