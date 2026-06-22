package com.example.trainingmatchservice.exception.handler;

import java.time.Instant;

public record ErrorResponse(
        boolean success,
        String message,
        Instant timestamp
) {
    public static ErrorResponse of(String message) {
        return new ErrorResponse(false, message, Instant.now());
    }
}

