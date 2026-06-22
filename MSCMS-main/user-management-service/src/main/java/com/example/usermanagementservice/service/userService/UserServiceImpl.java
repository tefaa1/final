package com.example.usermanagementservice.service.userService;
import com.example.usermanagementservice.dto.request.userReq.PasswordUpdateRequest;
import com.example.usermanagementservice.dto.request.userReq.UserSearchCriteria;
import com.example.usermanagementservice.dto.response.userRes.UserResponse;
import com.example.usermanagementservice.dto.response.userRes.UserStatsResponse;
import com.example.usermanagementservice.dto.update.userUp.UserUpdateRequest;
import com.example.usermanagementservice.exception.customException.InvalidOperationException;
import com.example.usermanagementservice.exception.customException.KeycloakException;
import com.example.usermanagementservice.exception.customException.ResourceNotFoundException;
import com.example.usermanagementservice.mapper.UserMapper;
import com.example.usermanagementservice.model.entity.User;
import com.example.usermanagementservice.model.enums.Role;
import com.example.usermanagementservice.repository.UserRepository;
import com.example.usermanagementservice.service.keycloakAdmin.KeycloakAdminService;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final KeycloakAdminService keycloakAdminService;

    @Override
    public UserResponse getUserById(Long id) {
        log.debug("Fetching user by ID: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return userMapper.toResponse(user);
    }

    @Override
    public UserResponse getUserByKeycloakId(String keycloakId) {
        log.debug("Fetching user by Keycloak ID: {}", keycloakId);
        User user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "keycloakId", keycloakId));
        return userMapper.toResponse(user);
    }

    @Override
    public UserResponse updateUser(Long id, UserUpdateRequest request) {
        log.debug("Updating user with ID: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        // Update in Keycloak
        try {
            Map<String, Object> keycloakUpdates = new HashMap<>();
            if (request.getUsername() != null) {
                keycloakUpdates.put("username", request.getUsername());
            }
            if (request.getEmail() != null) {
                keycloakUpdates.put("email", request.getEmail());
            }
            if (request.getFirstName() != null) {
                keycloakUpdates.put("firstName", request.getFirstName());
            }
            if (request.getLastName() != null) {
                keycloakUpdates.put("lastName", request.getLastName());
            }

            // Update attributes
            Map<String, List<String>> attributes = new HashMap<>();
            if (request.getAge() != null) {
                attributes.put("age", List.of(String.valueOf(request.getAge())));
            }
            if (request.getGender() != null) {
                attributes.put("gender", List.of(request.getGender().name()));
            }
            if (request.getAddress() != null) {
                attributes.put("address", List.of(request.getAddress()));
            }
            if (request.getPhone() != null) {
                attributes.put("phone", List.of(request.getPhone()));
            }
            if (!attributes.isEmpty()) {
                keycloakUpdates.put("attributes", attributes);
            }

            if (!keycloakUpdates.isEmpty()) {
                keycloakAdminService.updateUser(user.getKeycloakId(), keycloakUpdates);
            }
        } catch (KeycloakException e) {
            log.error("Failed to update user in Keycloak", e);
            throw new InvalidOperationException("Failed to update user in Keycloak: " + e.getMessage());
        }

        // Update in database
        userMapper.updateUserFromDto(request, user);
        User updatedUser = userRepository.save(user);

        log.info("User updated successfully: {}", id);
        return userMapper.toResponse(updatedUser);
    }

    @Override
    public void deleteUser(Long id) {
        log.debug("Deleting user with ID: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        // Delete from Keycloak
        try {
            keycloakAdminService.deleteUser(user.getKeycloakId());
        } catch (KeycloakException e) {
            log.error("Failed to delete user from Keycloak", e);
            throw new InvalidOperationException("Failed to delete user from Keycloak: " + e.getMessage());
        }

        // Delete from database
        userRepository.delete(user);
        log.info("User deleted successfully: {}", id);
    }

    @Override
    public List<UserResponse> searchUsers(UserSearchCriteria criteria) {
        log.debug("Searching users with criteria: {}", criteria);
        List<User> users = userRepository.searchUsers(
                criteria.getFirstName(),
                criteria.getLastName(),
                criteria.getEmail(),
                criteria.getGender(),
                criteria.getRole(),
                criteria.getMinAge(),
                criteria.getMaxAge()
        );
        return userMapper.toResponseList(users);
    }

    @Override
    public List<UserResponse> getAllUsers() {
        log.debug("Fetching all users");
        List<User> users = userRepository.findAll();
        return userMapper.toResponseList(users);
    }

    @Override
    public List<UserStatsResponse> getUserStatsByRole() {
        log.debug("Fetching user statistics by role");
        List<Object[]> results = userRepository.countUsersByRole();

        return results.stream()
                .map(result -> UserStatsResponse.builder()
                        .role((Role) result[0])
                        .count((Long) result[1])
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public void updatePassword(Long id, PasswordUpdateRequest request) {
        log.debug("Updating password for user ID: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        try {
            keycloakAdminService.updateUserPassword(user.getKeycloakId(), request.getNewPassword());
            log.info("Password updated successfully for user: {}", id);
        } catch (KeycloakException e) {
            log.error("Failed to update password in Keycloak", e);
            throw new InvalidOperationException("Failed to update password: " + e.getMessage());
        }
    }
}