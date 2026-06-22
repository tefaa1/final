package com.example.playerservice.service.impl;

import com.example.playerservice.dto.request.PlayerTransferOutgoingRequest;
import com.example.playerservice.dto.response.PlayerTransferOutgoingResponse;
import com.example.playerservice.exception.custom.ResourceNotFoundException;
import com.example.playerservice.mapper.PlayerTransferOutgoingMapper;
import com.example.playerservice.model.entity.OuterTeam;
import com.example.playerservice.model.entity.PlayerTransferOutgoing;
import com.example.playerservice.model.entity.Team;
import com.example.playerservice.model.enums.RequestStatus;
import com.example.playerservice.repository.OuterTeamRepository;
import com.example.playerservice.repository.PlayerTransferOutgoingRepository;
import com.example.playerservice.repository.TeamRepository;
import com.example.playerservice.service.PlayerTransferOutgoingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PlayerTransferOutgoingServiceImpl implements PlayerTransferOutgoingService {

    private final PlayerTransferOutgoingRepository transferOutgoingRepository;
    private final TeamRepository teamRepository;
    private final OuterTeamRepository outerTeamRepository;
    private final PlayerTransferOutgoingMapper transferOutgoingMapper;

    @Override
    public PlayerTransferOutgoingResponse createOutgoingTransfer(PlayerTransferOutgoingRequest request) {
        PlayerTransferOutgoing transfer = transferOutgoingMapper.toEntity(request);
        transfer.setFromTeam(getTeam(request.fromTeamId()));
        transfer.setToTeam(getOuterTeam(request.toOuterTeamId()));
        transfer.setStatus(RequestStatus.PENDING);
        return transferOutgoingMapper.toResponse(transferOutgoingRepository.save(transfer));
    }

    @Override
    public PlayerTransferOutgoingResponse updateOutgoingTransfer(Long id, PlayerTransferOutgoingRequest request) {
        PlayerTransferOutgoing transfer = getTransfer(id);
        if (request.fromTeamId() != null) {
            transfer.setFromTeam(getTeam(request.fromTeamId()));
        }
        if (request.toOuterTeamId() != null) {
            transfer.setToTeam(getOuterTeam(request.toOuterTeamId()));
        }
        transferOutgoingMapper.updateFromRequest(request, transfer);
        return transferOutgoingMapper.toResponse(transferOutgoingRepository.save(transfer));
    }

    @Override
    public void deleteOutgoingTransfer(Long id) {
        PlayerTransferOutgoing transfer = getTransfer(id);
        transferOutgoingRepository.delete(transfer);
    }

    @Override
    @Transactional(readOnly = true)
    public PlayerTransferOutgoingResponse getOutgoingTransferById(Long id) {
        return transferOutgoingMapper.toResponse(getTransfer(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PlayerTransferOutgoingResponse> getAllOutgoingTransfers() {
        return transferOutgoingRepository.findAll()
                .stream()
                .map(transferOutgoingMapper::toResponse)
                .toList();
    }

    private PlayerTransferOutgoing getTransfer(Long id) {
        return transferOutgoingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Outgoing transfer not found with id " + id));
    }

    private Team getTeam(Long id) {
        return teamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found with id " + id));
    }

    private OuterTeam getOuterTeam(Long id) {
        return outerTeamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Outer team not found with id " + id));
    }
}

