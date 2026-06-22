package com.example.usermanagementservice.dto.update.staffUp;


import com.example.usermanagementservice.model.enums.Gender;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StaffMemberUpdateRequest {
    private String firstName;
    private String lastName;
    private Integer age;
    private String phone;
    private String address;
    private Gender gender;
    private Long sportId;
    private Long teamId;

    // Specific fields
    private String skillType;
    private Integer yearsExperience;
    private String toolsUsed;
    private String coachingLicenseLevel;
    private List<String> preManagedTeams;
    private String specialization;
    private String specialty;
}