package com.example.usermanagementservice.dto.response.userRes;

import com.example.usermanagementservice.model.enums.Role;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserStatsResponse {
    private Role role;
    private Long count;
}