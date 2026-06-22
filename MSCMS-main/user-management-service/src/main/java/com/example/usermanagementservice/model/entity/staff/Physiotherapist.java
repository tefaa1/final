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
@Table(name = "physiotherapists")
public class Physiotherapist extends StaffMember{

    private int yearsExperience;

    @Enumerated(EnumType.STRING)
    private StaffRole staffRole = StaffRole.PHYSIOTHERAPIST;
}
