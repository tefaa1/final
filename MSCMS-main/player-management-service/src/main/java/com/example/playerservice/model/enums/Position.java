package com.example.playerservice.model.enums;

public enum Position {

    // ─── Football (10) ───────────────────────────────────────────────────────
    GOALKEEPER,
    RIGHT_BACK,
    LEFT_BACK,
    CENTER_BACK,
    DEFENSIVE_MID,
    CENTRAL_MID,
    ATTACKING_MID,
    RIGHT_WING,
    LEFT_WING,
    STRIKER,

    // ─── Basketball (5) ──────────────────────────────────────────────────────
    POINT_GUARD,
    SHOOTING_GUARD,
    SMALL_FORWARD,
    POWER_FORWARD,
    CENTER,

    // ─── Tennis (2) ──────────────────────────────────────────────────────────
    SINGLES_PLAYER,
    DOUBLES_PLAYER,

    // ─── Swimming (5) ────────────────────────────────────────────────────────
    FREESTYLE_SWIMMER,
    BACKSTROKE_SWIMMER,
    BREASTSTROKE_SWIMMER,
    BUTTERFLY_SWIMMER,
    MEDLEY_SWIMMER,

    // ─── Volleyball (6) ──────────────────────────────────────────────────────
    SETTER,
    OUTSIDE_HITTER,
    OPPOSITE_HITTER,
    MIDDLE_BLOCKER,
    LIBERO,
    DEFENSIVE_SPECIALIST,

    // ─── Handball (7 — HB_ prefix to avoid clash with football names) ────────
    HB_GOALKEEPER,
    HB_LEFT_WING,
    HB_RIGHT_WING,
    HB_LEFT_BACK,
    HB_RIGHT_BACK,
    HB_CENTRE_BACK,
    HB_PIVOT
}
