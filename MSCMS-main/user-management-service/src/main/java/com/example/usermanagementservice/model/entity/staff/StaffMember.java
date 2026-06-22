package com.example.usermanagementservice.model.entity.staff;

import com.example.usermanagementservice.model.entity.TeamManager;
import com.example.usermanagementservice.model.entity.User;
import com.example.usermanagementservice.model.enums.StaffRole;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "staff")
@Inheritance(strategy = InheritanceType.JOINED)
public abstract class StaffMember extends User {

    private Long sportId;

    private Long teamId;

    private StaffRole staffrole;

    @ManyToOne
    @JoinColumn(name = "team_manager_id")
    private TeamManager teamManager;
}
