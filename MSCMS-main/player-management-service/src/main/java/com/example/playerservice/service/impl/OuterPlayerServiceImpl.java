package com.example.playerservice.service.impl;

import com.example.playerservice.dto.request.OuterPlayerRequest;
import com.example.playerservice.dto.response.OuterPlayerResponse;
import com.example.playerservice.exception.custom.ResourceNotFoundException;
import com.example.playerservice.mapper.OuterPlayerMapper;
import com.example.playerservice.model.entity.OuterPlayer;
import com.example.playerservice.model.entity.OuterTeam;
import com.example.playerservice.repository.OuterPlayerRepository;
import com.example.playerservice.repository.OuterTeamRepository;
import com.example.playerservice.service.OuterPlayerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class OuterPlayerServiceImpl implements OuterPlayerService {

    private final OuterPlayerRepository outerPlayerRepository;
    private final OuterTeamRepository outerTeamRepository;
    private final OuterPlayerMapper outerPlayerMapper;

    @Override
    public OuterPlayerResponse createOuterPlayer(OuterPlayerRequest request) {
        OuterTeam outerTeam = getOuterTeam(request.outerTeamId());
        OuterPlayer player = outerPlayerMapper.toEntity(request);
        player.setOuterTeam(outerTeam);
        return outerPlayerMapper.toResponse(outerPlayerRepository.save(player));
    }

    @Override
    public OuterPlayerResponse updateOuterPlayer(Long id, OuterPlayerRequest request) {
        OuterPlayer player = getOuterPlayer(id);
        if (request.outerTeamId() != null) {
            player.setOuterTeam(getOuterTeam(request.outerTeamId()));
        }
        outerPlayerMapper.updateFromRequest(request, player);
        return outerPlayerMapper.toResponse(outerPlayerRepository.save(player));
    }

    @Override
    public void deleteOuterPlayer(Long id) {
        OuterPlayer player = getOuterPlayer(id);
        outerPlayerRepository.delete(player);
    }

    @Override
    @Transactional(readOnly = true)
    public OuterPlayerResponse getOuterPlayerById(Long id) {
        return outerPlayerMapper.toResponse(getOuterPlayer(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<OuterPlayerResponse> getAllOuterPlayers() {
        return outerPlayerRepository.findAll()
                .stream()
                .map(outerPlayerMapper::toResponse)
                .toList();
    }

    private OuterPlayer getOuterPlayer(Long id) {
        return outerPlayerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Outer player not found with id " + id));
    }

    private OuterTeam getOuterTeam(Long id) {
        return outerTeamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Outer team not found with id " + id));
    }
}

