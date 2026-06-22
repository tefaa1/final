package com.example.usermanagementservice.service.nationalTeamService;

import com.example.usermanagementservice.dto.request.nationalTeamReq.NationalTeamRequest;
import com.example.usermanagementservice.dto.response.nationalTeamReS.NationalTeamResponse;
import com.example.usermanagementservice.dto.update.nationalTeamUp.NationalTeamUpdateRequest;

import java.util.List;

public interface NationalTeamService {
    NationalTeamResponse createNationalTeam(NationalTeamRequest request);
    NationalTeamResponse getNationalTeamById(Long id);
    List<NationalTeamResponse> getAllNationalTeams();
    NationalTeamResponse updateNationalTeam(Long id, NationalTeamUpdateRequest request);
}
