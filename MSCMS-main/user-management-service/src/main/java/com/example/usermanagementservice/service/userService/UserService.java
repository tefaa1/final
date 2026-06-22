package com.example.usermanagementservice.service.userService;

import com.example.usermanagementservice.dto.request.userReq.PasswordUpdateRequest;
import com.example.usermanagementservice.dto.request.userReq.UserSearchCriteria;
import com.example.usermanagementservice.dto.response.userRes.UserResponse;
import com.example.usermanagementservice.dto.response.userRes.UserStatsResponse;
import com.example.usermanagementservice.dto.update.userUp.UserUpdateRequest;

import java.util.List;

public interface UserService {
    UserResponse getUserById(Long id);
    UserResponse getUserByKeycloakId(String keycloakId);
    UserResponse updateUser(Long id, UserUpdateRequest request);
    void deleteUser(Long id);
    List<UserResponse> searchUsers(UserSearchCriteria criteria);
    List<UserResponse> getAllUsers();
    List<UserStatsResponse> getUserStatsByRole();
    void updatePassword(Long id, PasswordUpdateRequest request);
}
