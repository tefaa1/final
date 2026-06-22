package com.example.medicalfitnessservice.service.kafka.outboxService;

import com.example.medicalfitnessservice.model.entity.FitnessTest;
import com.example.medicalfitnessservice.model.entity.Injury;
import com.example.medicalfitnessservice.model.entity.Rehabilitation;
import com.example.medicalfitnessservice.model.entity.Treatment;

public interface OutboxService {

    void publishInjuryReportedEvent(Injury injury);

    void publishInjuryStatusChangedEvent(Injury injury, String oldStatus);

    void publishFitnessTestCompletedEvent(FitnessTest test);

    void publishTreatmentCompletedEvent(Treatment treatment);

    void publishRehabilitationCompletedEvent(Rehabilitation rehab);
}
