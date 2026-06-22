package com.example.trainingmatchservice.mapper;

import com.example.trainingmatchservice.dto.request.MatchPerformanceReviewRequest;
import com.example.trainingmatchservice.dto.response.MatchPerformanceReviewResponse;
import com.example.trainingmatchservice.model.match.entity.Match;
import com.example.trainingmatchservice.model.match.entity.MatchPerformanceReview;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface MatchPerformanceReviewMapper {

    @Mapping(target = "matchId", source = "match.id")
    MatchPerformanceReviewResponse toResponse(MatchPerformanceReview entity);

    @Mapping(target = "match", source = "matchId")
    MatchPerformanceReview toEntity(MatchPerformanceReviewRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromRequest(MatchPerformanceReviewRequest request, @MappingTarget MatchPerformanceReview entity);

    default Match mapMatch(Long id) {
        if (id == null) return null;
        Match match = new Match();
        match.setId(id);
        return match;
    }
}

