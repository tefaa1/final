package com.example.usermanagementservice.dto.request.teamMangerReq;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignStaffRequest {
    @NotNull(message = "Staff member ID is required")
    private Long staffMemberId;
}