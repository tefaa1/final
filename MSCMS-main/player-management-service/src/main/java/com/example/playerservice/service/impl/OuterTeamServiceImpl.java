package com.example.playerservice.service.impl;

import com.example.playerservice.dto.request.OuterTeamRequest;
import com.example.playerservice.dto.response.OuterTeamResponse;
import com.example.playerservice.exception.custom.ResourceNotFoundException;
import com.example.playerservice.mapper.OuterTeamMapper;
import com.example.playerservice.model.entity.OuterTeam;
import com.example.playerservice.repository.OuterTeamRepository;
import com.example.playerservice.service.OuterTeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class OuterTeamServiceImpl implements OuterTeamService {

    private final OuterTeamRepository outerTeamRepository;
    private final OuterTeamMapper outerTeamMapper;

    @Override
    public OuterTeamResponse createOuterTeam(OuterTeamRequest request) {
        OuterTeam team = outerTeamMapper.toEntity(request);
        return outerTeamMapper.toResponse(outerTeamRepository.save(team));
    }

    @Override
    public OuterTeamResponse updateOuterTeam(Long id, OuterTeamRequest request) {
        OuterTeam team = getOuterTeam(id);
        outerTeamMapper.updateFromRequest(request, team);
        return outerTeamMapper.toResponse(outerTeamRepository.save(team));
    }

    @Override
    public void deleteOuterTeam(Long id) {
        OuterTeam team = getOuterTeam(id);
        outerTeamRepository.delete(team);
    }

    @Override
    @Transactional(readOnly = true)
    public OuterTeamResponse getOuterTeamById(Long id) {
        return outerTeamMapper.toResponse(getOuterTeam(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<OuterTeamResponse> getAllOuterTeams() {
        return outerTeamRepository.findAll()
                .stream()
                .map(outerTeamMapper::toResponse)
                .toList();
    }

    private OuterTeam getOuterTeam(Long id) {
        return outerTeamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Outer team not found with id " + id));
    }
}

