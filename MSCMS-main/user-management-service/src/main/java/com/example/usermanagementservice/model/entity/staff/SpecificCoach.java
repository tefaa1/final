package com.example.usermanagementservice.model.entity.staff;

import com.example.usermanagementservice.model.enums.StaffRole;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "specific_coaches")
public class SpecificCoach extends StaffMember{

    private String skillType;   // shooting, defending, GK, speed...

    @Enumerated(EnumType.STRING)
    private StaffRole staffRole = StaffRole.SPECIFIC_COACH;
}
