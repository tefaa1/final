package com.example.gateway_service.controller;

import com.example.gateway_service.dto.*;
import com.example.gateway_service.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Login, signup, token refresh, and logout")
public class AuthController {

    private static final String REFRESH_TOKEN_COOKIE = "refresh_token";
    private static final int REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Login", description = "Authenticate with username and password. Returns access_token in body and refresh_token as HTTP-only cookie.")
    public ResponseEntity<Map<String, Object>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {
        try {
            Map<String, Object> tokens = authService.login(request.getUsername(), request.getPassword());
            setRefreshTokenCookie(response, (String) tokens.get("refresh_token"));
            return ResponseEntity.ok(stripRefreshToken(tokens));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid username or password"));
        }
    }

    @PostMapping("/signup")
    @Operation(summary = "Sign up as Fan", description = "Register a new account with FAN role. Returns access_token in body and refresh_token as HTTP-only cookie.")
    public ResponseEntity<Map<String, Object>> signup(
            @Valid @RequestBody SignupRequest request,
            HttpServletResponse response) {
        try {
            Map<String, Object> result = authService.signup(request);
            setRefreshTokenCookie(response, (String) result.get("refresh_token"));
            return ResponseEntity.status(HttpStatus.CREATED).body(stripRefreshToken(result));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh token", description = "Get a new access token using the refresh_token cookie. No request body needed.")
    public ResponseEntity<Map<String, Object>> refresh(
            HttpServletRequest request,
            HttpServletResponse response) {
        try {
            String refreshToken = extractRefreshTokenFromCookie(request);
            if (refreshToken == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "No refresh token cookie found"));
            }
            Map<String, Object> tokens = authService.refresh(refreshToken);
            setRefreshTokenCookie(response, (String) tokens.get("refresh_token"));
            return ResponseEntity.ok(stripRefreshToken(tokens));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid or expired refresh token"));
        }
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout", description = "Invalidate the session and clear the refresh_token cookie.", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Map<String, Object>> logout(
            HttpServletRequest request,
            HttpServletResponse response) {
        try {
            String refreshToken = extractRefreshTokenFromCookie(request);
            if (refreshToken != null) {
                authService.logout(refreshToken);
            }
            clearRefreshTokenCookie(response);
            return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
        } catch (Exception e) {
            clearRefreshTokenCookie(response);
            return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
        }
    }

    @PostMapping("/admin/create-user")
    @Operation(summary = "Admin: Create user with role", description = "Create a new user with a specified role (ADMIN only)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Map<String, Object>> adminCreateUser(
            @Valid @RequestBody AdminCreateUserRequest request) {
        try {
            Map<String, Object> result = authService.adminCreateUser(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ======================== Cookie Helpers ========================

    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        Cookie cookie = new Cookie(REFRESH_TOKEN_COOKIE, refreshToken);
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // Set to true in production with HTTPS
        cookie.setPath("/auth");
        cookie.setMaxAge(REFRESH_TOKEN_MAX_AGE);
        response.addCookie(cookie);
    }

    private void clearRefreshTokenCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(REFRESH_TOKEN_COOKIE, "");
        cookie.setHttpOnly(true);
        cookie.setSecure(false);
        cookie.setPath("/auth");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }

    private String extractRefreshTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null)
            return null;
        for (Cookie cookie : request.getCookies()) {
            if (REFRESH_TOKEN_COOKIE.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    private Map<String, Object> stripRefreshToken(Map<String, Object> tokens) {
        Map<String, Object> result = new LinkedHashMap<>(tokens);
        result.remove("refresh_token");
        result.remove("refresh_expires_in");
        return result;
    }
}
