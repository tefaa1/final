package com.example.medicalfitnessservice.service;

import com.example.medicalfitnessservice.dto.request.TreatmentRequest;
import com.example.medicalfitnessservice.dto.response.TreatmentResponse;

import java.util.List;

public interface TreatmentService {
    TreatmentResponse createTreatment(TreatmentRequest request);
    TreatmentResponse updateTreatment(Long id, TreatmentRequest request);
    void deleteTreatment(Long id);
    TreatmentResponse getTreatmentById(Long id);
    List<TreatmentResponse> getAllTreatments();
}

