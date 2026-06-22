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
@Table(name = "fitness_coaches")
public class FitnessCoach extends StaffMember{

    @Enumerated(EnumType.STRING)
    private StaffRole staffRole = StaffRole.FITNESS_COACH;
}
