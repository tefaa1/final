package com.example.trainingmatchservice.service.kafka.outboxService;

import com.example.trainingmatchservice.model.match.entity.Match;
import com.example.trainingmatchservice.model.training.entity.TrainingSession;

public interface OutboxService {

    void publishMatchScheduledEvent(Match match);

    void publishMatchCompletedEvent(Match match);

    void publishMatchCancelledEvent(Match match, String reason);

    void publishTrainingSessionCompletedEvent(TrainingSession session);

    void publishTrainingSessionCancelledEvent(TrainingSession session, String reason);
}
