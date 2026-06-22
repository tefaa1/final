package com.example.trainingmatchservice.client;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.service.annotation.GetExchange;
import org.springframework.web.service.annotation.HttpExchange;
import com.example.trainingmatchservice.dto.response.external.TeamResponse;

@HttpExchange
public interface TeamClient {
    @GetExchange("/teams/{id}")
    TeamResponse getTeamById(@PathVariable Long id);
}
