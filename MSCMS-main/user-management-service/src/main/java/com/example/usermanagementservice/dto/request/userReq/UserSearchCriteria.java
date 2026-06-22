package com.example.usermanagementservice.dto.request.userReq;

import com.example.usermanagementservice.model.enums.Gender;
import com.example.usermanagementservice.model.enums.Role;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSearchCriteria {
    private String firstName;
    private String lastName;
    private String email;
    private Gender gender;
    private Role role;
    private Integer minAge;
    private Integer maxAge;
}
