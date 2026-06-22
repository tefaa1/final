package com.example.usermanagementservice.dto.response.staffRes;

import lombok.*;
import lombok.experimental.SuperBuilder;

// Fitness Coach Response (same as base)
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@SuperBuilder
public class FitnessCoachResponse extends StaffMemberResponse {
}
