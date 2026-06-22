package com.example.medicalfitnessservice.service.token;

import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.example.medicalfitnessservice.client.UserClient;
import com.example.medicalfitnessservice.dto.response.external.UserResponse;
import com.example.medicalfitnessservice.exception.custom.ResourceNotFoundException;

@RequiredArgsConstructor
@Service
public class TokenServiceImpl implements TokenService {

    private final UserClient userClient;

    @Override
    public String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) { return null; }
        return header.substring(7);
    }

    @Override
    public String extractUserId(HttpServletRequest request) {
        String token = extractToken(request);
        if (token == null) { throw new RuntimeException("Token not found in request"); }
        try {
            SignedJWT signed = SignedJWT.parse(token);
            JWTClaimsSet claims = signed.getJWTClaimsSet();
            return claims.getStringClaim("sub");
        } catch (Exception e) {
            throw new RuntimeException("Invalid JWT Token", e);
        }
    }

    @Override
    public String extractUserRole(HttpServletRequest request) {
        UserResponse currentUser = getCurrentUser(request);
        return currentUser.getRole();
    }

    @Override
    public UserResponse getCurrentUser(HttpServletRequest request) {
        String userId = extractUserId(request);
        try {
            return userClient.getUserByKeycloakId(userId);
        } catch (Exception e) {
            throw new ResourceNotFoundException("User not found with keycloakId: " + userId);
        }
    }
}
