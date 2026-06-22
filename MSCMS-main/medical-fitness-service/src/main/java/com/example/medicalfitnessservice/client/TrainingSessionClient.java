package com.example.medicalfitnessservice.client;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.service.annotation.GetExchange;
import org.springframework.web.service.annotation.HttpExchange;
import com.example.medicalfitnessservice.dto.response.external.TrainingSessionResponse;

@HttpExchange
public interface TrainingSessionClient {
    @GetExchange("/training-sessions/{id}")
    TrainingSessionResponse getTrainingSessionById(@PathVariable Long id);
}
