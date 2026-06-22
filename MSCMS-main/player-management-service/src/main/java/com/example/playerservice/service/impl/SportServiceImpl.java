package com.example.playerservice.service.impl;

import com.example.playerservice.dto.request.SportRequest;
import com.example.playerservice.dto.response.SportResponse;
import com.example.playerservice.exception.custom.ResourceNotFoundException;
import com.example.playerservice.mapper.SportMapper;
import com.example.playerservice.model.entity.Sport;
import com.example.playerservice.model.enums.SportType;
import com.example.playerservice.repository.SportRepository;
import com.example.playerservice.service.SportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SportServiceImpl implements SportService {

    private final SportRepository sportRepository;
    private final SportMapper sportMapper;

    @Override
    public SportResponse createSport(SportRequest request) {
        Sport sport = sportMapper.toEntity(request);
        return sportMapper.toResponse(sportRepository.save(sport));
    }

    @Override
    public SportResponse updateSport(Long id, SportRequest request) {
        Sport sport = getSport(id);
        sportMapper.updateFromRequest(request, sport);
        return sportMapper.toResponse(sportRepository.save(sport));
    }

    @Override
    public void deleteSport(Long id) {
        Sport sport = getSport(id);
        sportRepository.delete(sport);
    }

    @Override
    @Transactional(readOnly = true)
    public SportResponse getSportById(Long id) {
        return sportMapper.toResponse(getSport(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<SportResponse> getAllSports() {
        return sportRepository.findAll()
                .stream()
                .map(sportMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SportResponse> getSportsByType(SportType sportType) {
        return sportRepository.findBySportType(sportType)
                .stream()
                .map(sportMapper::toResponse)
                .toList();
    }

    private Sport getSport(Long id) {
        return sportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sport not found with id " + id));
    }
}
