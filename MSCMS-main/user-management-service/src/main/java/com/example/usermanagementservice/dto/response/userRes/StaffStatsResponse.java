package com.example.usermanagementservice.dto.response.userRes;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffStatsResponse {
    private String staffRole;
    private Long count;
}