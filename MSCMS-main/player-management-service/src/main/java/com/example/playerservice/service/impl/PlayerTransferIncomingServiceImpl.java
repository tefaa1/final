package com.example.playerservice.service.impl;

import com.example.playerservice.dto.request.PlayerTransferIncomingRequest;
import com.example.playerservice.dto.response.PlayerTransferIncomingResponse;
import com.example.playerservice.exception.custom.ResourceNotFoundException;
import com.example.playerservice.mapper.PlayerTransferIncomingMapper;
import com.example.playerservice.model.entity.OuterPlayer;
import com.example.playerservice.model.entity.OuterTeam;
import com.example.playerservice.model.entity.PlayerTransferIncoming;
import com.example.playerservice.model.entity.Team;
import com.example.playerservice.model.enums.RequestStatus;
import com.example.playerservice.repository.OuterPlayerRepository;
import com.example.playerservice.repository.OuterTeamRepository;
import com.example.playerservice.repository.PlayerTransferIncomingRepository;
import com.example.playerservice.repository.TeamRepository;
import com.example.playerservice.service.PlayerTransferIncomingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PlayerTransferIncomingServiceImpl implements PlayerTransferIncomingService {

    private final PlayerTransferIncomingRepository transferIncomingRepository;
    private final OuterPlayerRepository outerPlayerRepository;
    private final OuterTeamRepository outerTeamRepository;
    private final TeamRepository teamRepository;
    private final PlayerTransferIncomingMapper transferIncomingMapper;

    @Override
    public PlayerTransferIncomingResponse createIncomingTransfer(PlayerTransferIncomingRequest request) {
        PlayerTransferIncoming transfer = transferIncomingMapper.toEntity(request);
        transfer.setOuterPlayer(getOuterPlayer(request.outerPlayerId()));
        transfer.setFromTeam(getOuterTeam(request.fromOuterTeamId()));
        transfer.setToTeam(getTeam(request.toTeamId()));
        transfer.setStatus(RequestStatus.PENDING);
        return transferIncomingMapper.toResponse(transferIncomingRepository.save(transfer));
    }

    @Override
    public PlayerTransferIncomingResponse updateIncomingTransfer(Long id, PlayerTransferIncomingRequest request) {
        PlayerTransferIncoming transfer = getTransfer(id);
        if (request.outerPlayerId() != null) {
            transfer.setOuterPlayer(getOuterPlayer(request.outerPlayerId()));
        }
        if (request.fromOuterTeamId() != null) {
            transfer.setFromTeam(getOuterTeam(request.fromOuterTeamId()));
        }
        if (request.toTeamId() != null) {
            transfer.setToTeam(getTeam(request.toTeamId()));
        }
        transferIncomingMapper.updateFromRequest(request, transfer);
        return transferIncomingMapper.toResponse(transferIncomingRepository.save(transfer));
    }

    @Override
    public void deleteIncomingTransfer(Long id) {
        PlayerTransferIncoming transfer = getTransfer(id);
        transferIncomingRepository.delete(transfer);
    }

    @Override
    @Transactional(readOnly = true)
    public PlayerTransferIncomingResponse getIncomingTransferById(Long id) {
        return transferIncomingMapper.toResponse(getTransfer(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PlayerTransferIncomingResponse> getAllIncomingTransfers() {
        return transferIncomingRepository.findAll()
                .stream()
                .map(transferIncomingMapper::toResponse)
                .toList();
    }

    private PlayerTransferIncoming getTransfer(Long id) {
        return transferIncomingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incoming transfer not found with id " + id));
    }

    private OuterPlayer getOuterPlayer(Long id) {
        return outerPlayerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Outer player not found with id " + id));
    }

    private OuterTeam getOuterTeam(Long id) {
        return outerTeamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Outer team not found with id " + id));
    }

    private Team getTeam(Long id) {
        return teamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found with id " + id));
    }
}

