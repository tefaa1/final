package com.example.usermanagementservice.dto.response.staffRes;

import lombok.*;
import lombok.experimental.SuperBuilder;

// Assistant Coach Response
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class AssistantCoachResponse extends StaffMemberResponse {
    private String specialty;
}
