package com.example.usermanagementservice.dto.update.nationalTeamUp;
import com.example.usermanagementservice.model.enums.Gender;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NationalTeamUpdateRequest {
    private String firstName;
    private String lastName;
    private Integer age;
    private String phone;
    private String address;
    private Gender gender;
    private String federationName;
    private String contactPerson;
    private String country;
}