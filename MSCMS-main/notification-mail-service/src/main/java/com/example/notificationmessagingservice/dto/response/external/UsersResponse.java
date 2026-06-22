package com.example.notificationmessagingservice.dto.response.external;

import lombok.*;

import java.util.List;

/** Wrapper matching user-management's GET /users envelope: {success, message, data:[...]}. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsersResponse {
    private boolean success;
    private String message;
    private List<UserResponse> data;
}
