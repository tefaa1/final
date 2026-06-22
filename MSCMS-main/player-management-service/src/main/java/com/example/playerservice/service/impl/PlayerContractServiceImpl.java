package com.example.playerservice.service.impl;

import com.example.playerservice.dto.request.PlayerContractRequest;
import com.example.playerservice.dto.response.PlayerContractResponse;
import com.example.playerservice.exception.custom.ResourceNotFoundException;
import com.example.playerservice.mapper.PlayerContractMapper;
import com.example.playerservice.model.entity.PlayerContract;
import com.example.playerservice.repository.PlayerContractRepository;
import com.example.playerservice.service.PlayerContractService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PlayerContractServiceImpl implements PlayerContractService {

    private final PlayerContractRepository playerContractRepository;
    private final PlayerContractMapper playerContractMapper;

    @Override
    public PlayerContractResponse createPlayerContract(PlayerContractRequest request) {
        PlayerContract contract = playerContractMapper.toEntity(request);
        return playerContractMapper.toResponse(playerContractRepository.save(contract));
    }

    @Override
    public PlayerContractResponse updatePlayerContract(Long id, PlayerContractRequest request) {
        PlayerContract contract = getContract(id);
        playerContractMapper.updateFromRequest(request, contract);
        return playerContractMapper.toResponse(playerContractRepository.save(contract));
    }

    @Override
    public void deletePlayerContract(Long id) {
        PlayerContract contract = getContract(id);
        playerContractRepository.delete(contract);
    }

    @Override
    @Transactional(readOnly = true)
    public PlayerContractResponse getPlayerContractById(Long id) {
        return playerContractMapper.toResponse(getContract(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PlayerContractResponse> getAllPlayerContracts() {
        return playerContractRepository.findAll()
                .stream()
                .map(playerContractMapper::toResponse)
                .toList();
    }

    private PlayerContract getContract(Long id) {
        return playerContractRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Player contract not found with id " + id));
    }
}

