package com.example.trainingmatchservice.service.impl;

import com.example.trainingmatchservice.dto.request.MatchPerformanceReviewRequest;
import com.example.trainingmatchservice.dto.response.MatchPerformanceReviewResponse;
import com.example.trainingmatchservice.exception.custom.ResourceNotFoundException;
import com.example.trainingmatchservice.mapper.MatchPerformanceReviewMapper;
import com.example.trainingmatchservice.model.match.entity.Match;
import com.example.trainingmatchservice.model.match.entity.MatchPerformanceReview;
import com.example.trainingmatchservice.repository.MatchPerformanceReviewRepository;
import com.example.trainingmatchservice.repository.MatchRepository;
import com.example.trainingmatchservice.service.MatchPerformanceReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class MatchPerformanceReviewServiceImpl implements MatchPerformanceReviewService {

    private final MatchPerformanceReviewRepository matchPerformanceReviewRepository;
    private final MatchRepository matchRepository;
    private final MatchPerformanceReviewMapper matchPerformanceReviewMapper;

    @Override
    public MatchPerformanceReviewResponse createMatchPerformanceReview(MatchPerformanceReviewRequest request) {
        MatchPerformanceReview review = matchPerformanceReviewMapper.toEntity(request);
        review.setMatch(getMatch(request.matchId()));
        return matchPerformanceReviewMapper.toResponse(matchPerformanceReviewRepository.save(review));
    }

    @Override
    public MatchPerformanceReviewResponse updateMatchPerformanceReview(Long id, MatchPerformanceReviewRequest request) {
        MatchPerformanceReview review = getReview(id);
        if (request.matchId() != null) {
            review.setMatch(getMatch(request.matchId()));
        }
        matchPerformanceReviewMapper.updateFromRequest(request, review);
        return matchPerformanceReviewMapper.toResponse(matchPerformanceReviewRepository.save(review));
    }

    @Override
    public void deleteMatchPerformanceReview(Long id) {
        MatchPerformanceReview review = getReview(id);
        matchPerformanceReviewRepository.delete(review);
    }

    @Override
    @Transactional(readOnly = true)
    public MatchPerformanceReviewResponse getMatchPerformanceReviewById(Long id) {
        return matchPerformanceReviewMapper.toResponse(getReview(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<MatchPerformanceReviewResponse> getAllMatchPerformanceReviews() {
        return matchPerformanceReviewRepository.findAll()
                .stream()
                .map(matchPerformanceReviewMapper::toResponse)
                .toList();
    }

    private MatchPerformanceReview getReview(Long id) {
        return matchPerformanceReviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Match performance review not found with id " + id));
    }

    private Match getMatch(Long id) {
        return matchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Match not found with id " + id));
    }
}

