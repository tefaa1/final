package com.example.usermanagementservice.dto.response.staffRes;

import lombok.*;
import lombok.experimental.SuperBuilder;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class DoctorResponse extends StaffMemberResponse {
    private String specialization;
}
