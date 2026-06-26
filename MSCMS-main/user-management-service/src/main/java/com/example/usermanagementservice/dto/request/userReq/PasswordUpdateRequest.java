package com.example.usermanagementservice.dto.request.userReq;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PasswordUpdateRequest {
    // The current password — required, and verified against Keycloak before the
    // change is allowed. Accept either field name the frontend may send.
    private String oldPassword;
    private String currentPassword;

    @NotBlank(message = "New password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String newPassword;

    /** The supplied current password under either accepted key. */
    public String resolveCurrentPassword() {
        if (oldPassword != null && !oldPassword.isBlank()) return oldPassword;
        return currentPassword;
    }
}
