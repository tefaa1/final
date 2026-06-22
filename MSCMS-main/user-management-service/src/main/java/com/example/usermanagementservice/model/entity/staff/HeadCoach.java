package com.example.usermanagementservice.model.entity.staff;

import com.example.usermanagementservice.model.enums.StaffRole;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "head_coaches")
public class HeadCoach extends StaffMember{

    private int yearsOfExperience;

    private String coachingLicenseLevel;

    @ElementCollection
    @CollectionTable(
            name = "pre_managed_teams",
            joinColumns = @JoinColumn(name = "head_coach_id")
    )
    private List<String> PreManagedTeams = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    private StaffRole staffRole = StaffRole.HEAD_COACH;
}
