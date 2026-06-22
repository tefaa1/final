package com.example.usermanagementservice.service.teamManagerService;
import com.example.usermanagementservice.dto.request.teamMangerReq.AssignStaffRequest;
import com.example.usermanagementservice.dto.request.teamMangerReq.TeamManagerRequest;
import com.example.usermanagementservice.dto.request.userReq.UserRequest;
import com.example.usermanagementservice.dto.response.teamManagerRes.TeamManagerResponse;
import com.example.usermanagementservice.dto.update.teamManagerUp.TeamManagerUpdateRequest;
import com.example.usermanagementservice.exception.customException.*;
import com.example.usermanagementservice.mapper.TeamManagerMapper;
import com.example.usermanagementservice.model.entity.SportManager;
import com.example.usermanagementservice.model.entity.TeamManager;
import com.example.usermanagementservice.model.entity.staff.StaffMember;
import com.example.usermanagementservice.model.enums.Role;
import com.example.usermanagementservice.repository.SportManagerRepository;
import com.example.usermanagementservice.repository.StaffMemberRepository;
import com.example.usermanagementservice.repository.TeamManagerRepository;
import com.example.usermanagementservice.service.keycloakAdmin.KeycloakAdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TeamManagerServiceImpl implements TeamManagerService {

    private final TeamManagerRepository teamManagerRepository;
    private final SportManagerRepository sportManagerRepository;
    private final StaffMemberRepository staffMemberRepository;
    private final TeamManagerMapper teamManagerMapper;
    private final KeycloakAdminService keycloakAdminService;

    @Override
    public TeamManagerResponse createTeamManager(TeamManagerRequest request) {
        log.debug("Creating team manager: {}", request.getUsername());

        // Verify sport manager exists
        SportManager sportManager = sportManagerRepository.findById(request.getSportManagerId())
                .orElseThrow(() -> new ResourceNotFoundException("Sport Manager", "id", request.getSportManagerId()));

        // Check if email already exists
        if (teamManagerRepository.findAll().stream()
                .anyMatch(tm -> tm.getEmail().equals(request.getEmail()))) {
            throw new DuplicateResourceException("Team Manager", "email", request.getEmail());
        }

        // Create user in Keycloak
        UserRequest keycloakRequest = buildKeycloakRequest(request);
        String keycloakId;
        try {
            String token = keycloakAdminService.getAdminAccessToken();
            keycloakId = keycloakAdminService.createUser(token, keycloakRequest);

            // Assign role
            keycloakAdminService.assignRealmRoleToUser(keycloakId, "TEAM_MANAGER");
        } catch (KeycloakException e) {
            log.error("Failed to create user in Keycloak", e);
            throw new InvalidOperationException("Failed to create user in Keycloak: " + e.getMessage());
        }

        // Create in database
        TeamManager teamManager = teamManagerMapper.toEntity(request);
        teamManager.setKeycloakId(keycloakId);
        teamManager.setSportManager(sportManager);
        TeamManager saved = teamManagerRepository.save(teamManager);

        log.info("Team manager created successfully: {}", saved.getId());
        return teamManagerMapper.toResponse(saved);
    }

    @Override
    public TeamManagerResponse getTeamManagerById(Long id) {
        log.debug("Fetching team manager by ID: {}", id);
        TeamManager teamManager = teamManagerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team Manager", "id", id));
        return teamManagerMapper.toResponse(teamManager);
    }

    @Override
    public TeamManagerResponse updateTeamManager(Long id, TeamManagerUpdateRequest request) {
        log.debug("Updating team manager with ID: {}", id);
        TeamManager teamManager = teamManagerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team Manager", "id", id));

        teamManagerMapper.updateFromDto(request, teamManager);
        TeamManager updated = teamManagerRepository.save(teamManager);

        log.info("Team manager updated successfully: {}", id);
        return teamManagerMapper.toResponse(updated);
    }

    @Override
    public TeamManagerResponse assignStaff(Long teamManagerId, AssignStaffRequest request) {
        log.debug("Assigning staff member {} to team manager {}", request.getStaffMemberId(), teamManagerId);

        TeamManager teamManager = teamManagerRepository.findById(teamManagerId)
                .orElseThrow(() -> new ResourceNotFoundException("Team Manager", "id", teamManagerId));

        StaffMember staffMember = staffMemberRepository.findById(request.getStaffMemberId())
                .orElseThrow(() -> new ResourceNotFoundException("Staff Member", "id", request.getStaffMemberId()));

        // Verify staff member can be managed
        if (!teamManager.getCanManageAllStaffMembers() &&
                !staffMember.getTeamId().equals(teamManager.getTeamId())) {
            throw new UnauthorizedAccessException("Team manager cannot manage staff from other teams");
        }

        staffMember.setTeamManager(teamManager);
        staffMemberRepository.save(staffMember);

        log.info("Staff member assigned successfully to team manager");
        return teamManagerMapper.toResponse(teamManager);
    }

    private UserRequest buildKeycloakRequest(TeamManagerRequest request) {
        UserRequest keycloakRequest = new UserRequest();
        keycloakRequest.setUsername(request.getUsername());
        keycloakRequest.setEmail(request.getEmail());
        keycloakRequest.setPassword(request.getPassword());
        keycloakRequest.setFirstName(request.getFirstName());
        keycloakRequest.setLastName(request.getLastName());
        keycloakRequest.setAge(request.getAge());
        keycloakRequest.setPhone(request.getPhone());
        keycloakRequest.setAddress(request.getAddress());
        keycloakRequest.setGender(request.getGender());
        keycloakRequest.setRole(Role.TEAM_MANGER);
        return keycloakRequest;
    }
}