package com.example.usermanagementservice.repository;

import com.example.usermanagementservice.model.entity.staff.StaffMember;
import com.example.usermanagementservice.model.enums.StaffRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public interface StaffMemberRepository extends JpaRepository<StaffMember, Long> {
    Optional<StaffMember> findByKeycloakId(String keycloakId);
    List<StaffMember> findByTeamId(Long teamId);
    List<StaffMember> findBySportId(Long sportId);
    List<StaffMember> findByStaffrole(StaffRole staffRole);
    List<StaffMember> findByTeamManager_Id(Long teamManagerId);

    @Query("SELECT s.staffrole as staffRole, COUNT(s) as count FROM StaffMember s WHERE s.teamId = :teamId GROUP BY s.staffrole")
    List<Object[]> countStaffByRoleAndTeam(@Param("teamId") Long teamId);
}