package com.example.usermanagementservice.service.staffMemberService;

import com.example.usermanagementservice.dto.request.staffReq.StaffMemberRequest;
import com.example.usermanagementservice.dto.request.userReq.UserRequest;
import com.example.usermanagementservice.dto.response.staffRes.StaffMemberResponse;
import com.example.usermanagementservice.dto.response.userRes.StaffStatsResponse;
import com.example.usermanagementservice.dto.update.staffUp.StaffMemberUpdateRequest;
import com.example.usermanagementservice.exception.customException.InvalidOperationException;
import com.example.usermanagementservice.exception.customException.KeycloakException;
import com.example.usermanagementservice.exception.customException.ResourceNotFoundException;
import com.example.usermanagementservice.mapper.*;
import com.example.usermanagementservice.model.entity.TeamManager;
import com.example.usermanagementservice.model.entity.staff.*;
import com.example.usermanagementservice.model.enums.Role;
import com.example.usermanagementservice.model.enums.StaffRole;
import com.example.usermanagementservice.repository.*;
import com.example.usermanagementservice.service.keycloakAdmin.KeycloakAdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class StaffMemberServiceImpl implements StaffMemberService {

    private final StaffMemberRepository staffMemberRepository;
    private final HeadCoachRepository headCoachRepository;
    private final AssistantCoachRepository assistantCoachRepository;
    private final SpecificCoachRepository specificCoachRepository;
    private final FitnessCoachRepository fitnessCoachRepository;
    private final PerformanceAnalystRepository performanceAnalystRepository;
    private final PhysiotherapistRepository physiotherapistRepository;
    private final DoctorRepository doctorRepository;
    private final TeamManagerRepository teamManagerRepository;

    private final StaffMemberMapper staffMemberMapper;
    private final HeadCoachMapper headCoachMapper;
    private final AssistantCoachMapper assistantCoachMapper;
    private final SpecificCoachMapper specificCoachMapper;
    private final FitnessCoachMapper fitnessCoachMapper;
    private final PerformanceAnalystMapper performanceAnalystMapper;
    private final PhysiotherapistMapper physiotherapistMapper;
    private final DoctorMapper doctorMapper;

    private final KeycloakAdminService keycloakAdminService;

    @Override
    public StaffMemberResponse createStaffMember(StaffMemberRequest request) {
        log.debug("Creating staff member: {}", request.getUsername());

        // Create user in Keycloak
        UserRequest keycloakRequest = buildKeycloakRequest(request);
        String keycloakId;
        try {
            String token = keycloakAdminService.getAdminAccessToken();
            keycloakId = keycloakAdminService.createUser(token, keycloakRequest);
            keycloakAdminService.assignRealmRoleToUser(keycloakId, request.getStaffRole().name());
        } catch (KeycloakException e) {
            throw new InvalidOperationException("Failed to create user in Keycloak: " + e.getMessage());
        }

        // Create specific staff type
        StaffMember staffMember = createSpecificStaffType(request, keycloakId);

        // Set team manager if provided
        if (request.getTeamManagerId() != null) {
            TeamManager teamManager = teamManagerRepository.findById(request.getTeamManagerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Team Manager", "id", request.getTeamManagerId()));
            staffMember.setTeamManager(teamManager);
        }

        StaffMember saved = saveStaffMember(staffMember, request.getStaffRole());

        log.info("Staff member created successfully: {}", saved.getId());
        return staffMemberMapper.toResponse(saved);
    }

    @Override
    public StaffMemberResponse getStaffMemberById(Long id) {
        StaffMember staffMember = staffMemberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff Member", "id", id));
        return staffMemberMapper.toResponse(staffMember);
    }

    @Override
    public List<StaffMemberResponse> getAllStaffMembers() {
        return staffMemberMapper.toResponseList(staffMemberRepository.findAll());
    }

    @Override
    public List<StaffMemberResponse> getStaffByTeamId(Long teamId) {
        return staffMemberMapper.toResponseList(staffMemberRepository.findByTeamId(teamId));
    }

    @Override
    public List<StaffMemberResponse> getStaffByRole(StaffRole role) {
        return staffMemberMapper.toResponseList(staffMemberRepository.findByStaffrole(role));
    }

    @Override
    public StaffMemberResponse updateStaffMember(Long id, StaffMemberUpdateRequest request) {
        StaffMember staffMember = staffMemberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff Member", "id", id));

        staffMemberMapper.updateFromDto(request, staffMember);

        // Update specific fields based on staff type
        updateSpecificStaffFields(staffMember, request);

        StaffMember updated = staffMemberRepository.save(staffMember);
        return staffMemberMapper.toResponse(updated);
    }

    @Override
    public List<StaffStatsResponse> getStaffStatsByTeam(Long teamId) {
        List<Object[]> results = staffMemberRepository.countStaffByRoleAndTeam(teamId);
        return results.stream()
                .map(result -> StaffStatsResponse.builder()
                        .staffRole(((StaffRole) result[0]).name())
                        .count((Long) result[1])
                        .build())
                .collect(Collectors.toList());
    }

    private StaffMember createSpecificStaffType(StaffMemberRequest request, String keycloakId) {
        StaffMember staff = switch (request.getStaffRole()) {
            case HEAD_COACH -> headCoachMapper.toEntity(request);
            case ASSISTANT_COACH -> assistantCoachMapper.toEntity(request);
            case SPECIFIC_COACH -> specificCoachMapper.toEntity(request);
            case FITNESS_COACH -> fitnessCoachMapper.toEntity(request);
            case PERFORMANCE_ANALYST -> performanceAnalystMapper.toEntity(request);
            case PHYSIOTHERAPIST -> physiotherapistMapper.toEntity(request);
            case TEAM_DOCTOR -> doctorMapper.toEntity(request);
        };
        staff.setKeycloakId(keycloakId);
        return staff;
    }

    private StaffMember saveStaffMember(StaffMember staff, StaffRole role) {
        return switch (role) {
            case HEAD_COACH -> headCoachRepository.save((HeadCoach) staff);
            case ASSISTANT_COACH -> assistantCoachRepository.save((AssistantCoach) staff);
            case SPECIFIC_COACH -> specificCoachRepository.save((SpecificCoach) staff);
            case FITNESS_COACH -> fitnessCoachRepository.save((FitnessCoach) staff);
            case PERFORMANCE_ANALYST -> performanceAnalystRepository.save((PerformanceAnalyst) staff);
            case PHYSIOTHERAPIST -> physiotherapistRepository.save((Physiotherapist) staff);
            case TEAM_DOCTOR -> doctorRepository.save((Doctor) staff);
        };
    }

    private void updateSpecificStaffFields(StaffMember staff, StaffMemberUpdateRequest request) {
        if (staff instanceof HeadCoach hc && request.getYearsExperience() != null) {
            hc.setYearsOfExperience(request.getYearsExperience());
        } else if (staff instanceof SpecificCoach sc && request.getSkillType() != null) {
            sc.setSkillType(request.getSkillType());
        } else if (staff instanceof Physiotherapist pt && request.getYearsExperience() != null) {
            pt.setYearsExperience(request.getYearsExperience());
        } else if (staff instanceof PerformanceAnalyst pa) {
            if (request.getYearsExperience() != null) pa.setYearsExperience(request.getYearsExperience());
            if (request.getToolsUsed() != null) pa.setToolsUsed(request.getToolsUsed());
        } else if (staff instanceof Doctor doc && request.getSpecialization() != null) {
            doc.setSpecialization(request.getSpecialization());
        } else if (staff instanceof AssistantCoach ac && request.getSpecialty() != null) {
            ac.setSpecialty(request.getSpecialty());
        }
    }

    private UserRequest buildKeycloakRequest(StaffMemberRequest request) {
        UserRequest kr = new UserRequest();
        kr.setUsername(request.getUsername());
        kr.setEmail(request.getEmail());
        kr.setPassword(request.getPassword());
        kr.setFirstName(request.getFirstName());
        kr.setLastName(request.getLastName());
        kr.setAge(request.getAge());
        kr.setPhone(request.getPhone());
        kr.setAddress(request.getAddress());
        kr.setGender(request.getGender());
        kr.setRole(Role.STAFF);
        return kr;
    }
}