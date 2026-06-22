package com.example.usermanagementservice.model.entity;

import com.example.usermanagementservice.model.entity.staff.StaffMember;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "taems_managers")
public class TeamManager extends User{

    private Long teamId;

    private Boolean canManageAllStaffMembers = true;

    @ManyToOne
    @JoinColumn(name = "sport_Manager_id")
    private SportManager sportManager;

    @OneToMany(mappedBy = "teamManager",cascade = {CascadeType.PERSIST,CascadeType.MERGE})
    private Set<StaffMember>staffMembers = new HashSet<>();
}
