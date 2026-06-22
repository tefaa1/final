package com.example.trainingmatchservice.dto.request;

import com.example.trainingmatchservice.dto.validation.Create;
import com.example.trainingmatchservice.dto.validation.Update;
import com.example.trainingmatchservice.model.match.enums.MatchStatus;
import com.example.trainingmatchservice.model.match.enums.MatchType;
import com.example.trainingmatchservice.model.match.enums.SportType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.*;

import java.time.LocalDateTime;

public record MatchRequest(
        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long homeTeamId,

        @Positive(groups = {Create.class, Update.class})
        Long outerTeamId,

        // Real opponent (for manually scheduled matches against external clubs).
        String opponentName,
        String opponentCrest,

        @NotNull(groups = Create.class)
        MatchType matchType,

        @NotNull(groups = Create.class)
        MatchStatus status,

        @NotNull(groups = Create.class)
        SportType sportType,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String venue,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String competition,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String season,

        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer homeTeamScore,

        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer awayTeamScore,

        @NotNull(groups = Create.class)
        LocalDateTime kickoffTime,

        LocalDateTime finishTime,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String referee,

        @Positive(groups = {Create.class, Update.class})
        Integer attendance,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String matchSummary,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String notes,

        @Positive(groups = {Create.class, Update.class})
        Long matchFormationId
) {
    public MatchRequest {
        venue = venue != null ? venue.trim() : null;
        competition = competition != null ? competition.trim() : null;
        season = season != null ? season.trim() : null;
        referee = referee != null ? referee.trim() : null;
        matchSummary = matchSummary != null ? matchSummary.trim() : null;
        notes = notes != null ? notes.trim() : null;
    }
}

