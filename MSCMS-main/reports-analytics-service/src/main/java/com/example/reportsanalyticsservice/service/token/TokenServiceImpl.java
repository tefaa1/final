package com.example.reportsanalyticsservice.service.token;

import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.example.reportsanalyticsservice.client.UserClient;
import com.example.reportsanalyticsservice.dto.response.external.UserResponse;
import com.example.reportsanalyticsservice.exception.custom.ResourceNotFoundException;

import java.util.Collection;
import java.util.Map;
import java.util.stream.Collectors;

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
        } catch (Exception e) { throw new RuntimeException("Invalid JWT Token", e); }
    }

    @Override
    public String extractUserRole(HttpServletRequest request) {
        // Read the role(s) straight from the forwarded JWT. Keycloak puts realm
        // roles under realm_access.roles (bare names like "ADMIN", "SPONSOR"),
        // which is exactly what the gateway authorizes against. We intentionally
        // do NOT depend on a downstream user-service lookup here: the UserClient
        // RestClient does not forward the caller's Authorization header, so that
        // call 401s and the role would come back null for every caller.
        String fromJwt = extractRealmRolesFromJwt(request);
        if (fromJwt != null && !fromJwt.isBlank()) { return fromJwt; }
        // Fallback: if the JWT carried no realm roles, fall back to the (legacy)
        // user-service lookup so other callers are not regressed.
        return getCurrentUser(request).getRole();
    }

    // Returns the realm roles as a comma-separated string (e.g. "ADMIN,SPONSOR")
    // or null when the token is missing/unparseable or carries no realm roles.
    private String extractRealmRolesFromJwt(HttpServletRequest request) {
        String token = extractToken(request);
        if (token == null) { return null; }
        try {
            SignedJWT signed = SignedJWT.parse(token);
            JWTClaimsSet claims = signed.getJWTClaimsSet();
            Object realmAccess = claims.getClaim("realm_access");
            if (!(realmAccess instanceof Map<?, ?> realmAccessMap)) { return null; }
            Object rolesObj = realmAccessMap.get("roles");
            if (!(rolesObj instanceof Collection<?> roles) || roles.isEmpty()) { return null; }
            return roles.stream()
                    .filter(java.util.Objects::nonNull)
                    .map(Object::toString)
                    .collect(Collectors.joining(","));
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    public UserResponse getCurrentUser(HttpServletRequest request) {
        String userId = extractUserId(request);
        try { return userClient.getUserByKeycloakId(userId); }
        catch (Exception e) { throw new ResourceNotFoundException("User not found with keycloakId: " + userId); }
    }
}
