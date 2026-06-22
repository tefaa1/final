package com.example.playerservice.service.impl;

import com.example.playerservice.dto.request.PlayerCallUpRequestCreate;
import com.example.playerservice.dto.response.PlayerCallUpResponse;
import com.example.playerservice.exception.custom.ResourceNotFoundException;
import com.example.playerservice.mapper.PlayerCallUpRequestMapper;
import com.example.playerservice.model.entity.PlayerCallUpRequest;
import com.example.playerservice.model.enums.RequestStatus;
import com.example.playerservice.repository.PlayerCallUpRequestRepository;
import com.example.playerservice.service.PlayerCallUpRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PlayerCallUpRequestServiceImpl implements PlayerCallUpRequestService {

    private final PlayerCallUpRequestRepository playerCallUpRequestRepository;
    private final PlayerCallUpRequestMapper playerCallUpRequestMapper;

    @Override
    public PlayerCallUpResponse createCallUpRequest(PlayerCallUpRequestCreate request) {
        PlayerCallUpRequest entity = playerCallUpRequestMapper.toEntity(request);
        entity.setStatus(RequestStatus.PENDING);
        return playerCallUpRequestMapper.toResponse(playerCallUpRequestRepository.save(entity));
    }

    @Override
    public PlayerCallUpResponse updateCallUpRequest(Long id, PlayerCallUpRequestCreate request) {
        PlayerCallUpRequest entity = getRequest(id);
        playerCallUpRequestMapper.updateFromRequest(request, entity);
        return playerCallUpRequestMapper.toResponse(playerCallUpRequestRepository.save(entity));
    }

    @Override
    public void deleteCallUpRequest(Long id) {
        PlayerCallUpRequest entity = getRequest(id);
        playerCallUpRequestRepository.delete(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public PlayerCallUpResponse getCallUpRequestById(Long id) {
        return playerCallUpRequestMapper.toResponse(getRequest(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PlayerCallUpResponse> getAllCallUpRequests() {
        return playerCallUpRequestRepository.findAll()
                .stream()
                .map(playerCallUpRequestMapper::toResponse)
                .toList();
    }

    private PlayerCallUpRequest getRequest(Long id) {
        return playerCallUpRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Player call-up request not found with id " + id));
    }
}

