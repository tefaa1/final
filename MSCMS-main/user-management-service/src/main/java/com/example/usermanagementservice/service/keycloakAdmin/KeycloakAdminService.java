package com.example.usermanagementservice.service.keycloakAdmin;


import com.example.usermanagementservice.dto.request.userReq.UserRequest;

import java.util.Map;

public interface KeycloakAdminService {
    String createUser(String token, UserRequest userRequest);

    String getAdminAccessToken();

    Map<String, Object> getClientRoleRepresentation(String token, String roleName);

    void assignClientRoleToUser(String userId, String roleName);

    Map<String, Object> getRealmRoleRepresentation(String token, String roleName);

    void assignRealmRoleToUser(String userId, String roleName);

    void deleteUser(String userId);

    void updateUser(String userId, Map<String, Object> updatedFields);

    void updateUserPassword(String userId, String newPassword);
}
