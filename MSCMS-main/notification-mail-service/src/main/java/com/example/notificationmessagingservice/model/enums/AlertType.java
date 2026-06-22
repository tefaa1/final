package com.example.notificationmessagingservice.model.enums;

public enum AlertType {
    // System
    SYSTEM,
    OTHER,

    // Medical & fitness
    INJURY_REPORTED,
    MEDICAL_CHECKUP_DUE,
    FITNESS_TEST_DUE,
    REHABILITATION_MILESTONE,

    // Performance
    KPI_DROP,
    REPORT_GENERATED,

    // Match & training
    MATCH_UPCOMING,
    MATCH_RESULT_AVAILABLE,
    GOAL_SCORED,
    MATCH_LIVE,
    TRAINING_CANCELLED,

    // Player management
    PLAYER_SUSPENSION,
    TRANSFER_COMPLETED,
    CONTRACT_EXPIRING,

    // Scouting & sponsorship
    SCOUT_REPORT_SUBMITTED,
    SPONSOR_OFFER_RECEIVED
}
