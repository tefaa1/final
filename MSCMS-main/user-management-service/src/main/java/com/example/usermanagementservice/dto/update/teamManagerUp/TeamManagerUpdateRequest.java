package com.example.usermanagementservice.dto.update.teamManagerUp;

import com.example.usermanagementservice.model.enums.Gender;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeamManagerUpdateRequest {
    private String firstName;
    private String lastName;
    private Integer age;
    private String phone;
    private String address;
    private Gender gender;
    private Long teamId;
    private Boolean canManageAllStaffMembers;
}
