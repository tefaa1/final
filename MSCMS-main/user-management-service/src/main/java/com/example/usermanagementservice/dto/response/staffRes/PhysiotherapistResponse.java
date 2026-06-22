package com.example.usermanagementservice.dto.response.staffRes;

import lombok.*;
import lombok.experimental.SuperBuilder;

// Physiotherapist Response
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class PhysiotherapistResponse extends StaffMemberResponse {
    private Integer yearsExperience;
}
