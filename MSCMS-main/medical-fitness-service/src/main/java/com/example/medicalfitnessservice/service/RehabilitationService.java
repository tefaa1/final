package com.example.medicalfitnessservice.service;

import com.example.medicalfitnessservice.dto.request.RehabilitationRequest;
import com.example.medicalfitnessservice.dto.response.RehabilitationResponse;

import java.util.List;

public interface RehabilitationService {
    RehabilitationResponse createRehabilitation(RehabilitationRequest request);
    RehabilitationResponse updateRehabilitation(Long id, RehabilitationRequest request);
    void deleteRehabilitation(Long id);
    RehabilitationResponse getRehabilitationById(Long id);
    List<RehabilitationResponse> getAllRehabilitations();
}

