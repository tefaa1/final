// Centralised "what happens when a player's injury state changes".
// A player is INJURED (Restricted) from the moment an injury is logged until a
// PASSING fitness test clears them. While restricted they are pulled from match
// lineups, training sessions and attendance, and the whole team is notified.

import { api } from "@/src/lib/api";

const unwrap = (r) => r?.data || r?.content || (Array.isArray(r) ? r : []);
const parseIds = (s) => { try { const a = JSON.parse(s || "[]"); return Array.isArray(a) ? a.map(Number) : []; } catch { return []; } };

// Fitness-test result categories that count as "passed → cleared to return".
export const FITNESS_PASS = ["PASS", "PASSED", "CLEARED", "FIT", "EXCELLENT", "GOOD", "AVERAGE", "OPTIMAL"];
export const FITNESS_FAIL = ["FAIL", "FAILED", "POOR", "NOT_CLEARED", "BELOW"];
export function isFitnessPass(test) {
    return FITNESS_PASS.includes(String(test?.resultCategory || "").toUpperCase().trim());
}

// ─── SINGLE SOURCE OF TRUTH for an injury's current stage ─────────────────────
// The injury.status lifecycle is the ONLY thing that decides how far a player has
// progressed. Both the landing card (5-stage bar) and the journey stepper (6-stage
// timeline) derive their "current stage" from this — so they can never disagree.
// A stray sub-record (a leftover diagnosis/treatment/fitness from a previous test
// run) must NOT push the stage forward; only the status does.
//
// status      → stagesDone (how many lifecycle steps are COMPLETE)
//   REPORTED   → 1  (injury reported; diagnosis is the next action)
//   DIAGNOSED  → 2  (diagnosis done; treatment next)
//   TREATING   → 3  (treatment done; rehabilitation next)
//   RECOVERING → 4  (rehab/recovery done; fitness test next)
//   RECOVERED  → 6  (fitness passed; fully fit / workflow complete)
//   CHRONIC    → 3  (ongoing care, treat like under treatment — still active)
const STATUS_STAGES_DONE = {
    REPORTED: 1,
    DIAGNOSED: 2,
    TREATING: 3,
    CHRONIC: 3,
    RECOVERING: 4,
    RECOVERED: 6,
};

// Statuses for which the player is still working back to fitness (NOT cleared).
// A player is "currently injured / unavailable" iff they hold an injury whose
// status is one of these (i.e. it is anything other than RECOVERED).
export const ACTIVE_INJURY_STATUSES = ["REPORTED", "DIAGNOSED", "TREATING", "RECOVERING", "CHRONIC"];

export function normStatus(injury) {
    return String(injury?.status || "").toUpperCase().trim();
}

export function isActiveInjury(injury) {
    return ACTIVE_INJURY_STATUSES.includes(normStatus(injury));
}

// The canonical "how far along" number, 0..6, derived ONLY from injury.status.
// Used by both UIs as the one source of truth.
export function stageFromInjury(injury) {
    const st = normStatus(injury);
    if (!injury) return 0;
    return STATUS_STAGES_DONE[st] ?? 1; // any logged injury is at least "reported"
}

// All team members' keycloakIds (players via roster + staff via teamId), minus
// the injured player themselves.
function teamRecipients(teamId, excludePlayerId, ctx) {
    const out = new Set();
    const ptm = ctx.playerTeamMap || {};
    for (const p of ctx.players || []) {
        if (Number(ptm[Number(p.id)]) === Number(teamId) && Number(p.id) !== Number(excludePlayerId) && p.keycloakId) out.add(p.keycloakId);
    }
    for (const s of ctx.staff || []) {
        if (Number(s.teamId) === Number(teamId) && s.keycloakId) out.add(s.keycloakId);
    }
    return [...out];
}

// Flag INJURED + remove from lineups/sessions/attendance + email the whole team.
// ctx: { players, staff, playerTeamMap, teamId? }
export async function restrictInjuredPlayer(player, ctx = {}) {
    const playerId = Number(player.id);
    const out = { lineups: 0, sessions: 0, attendance: 0, notified: 0 };

    try { await api.updatePlayerStatus(playerId, "INJURED"); } catch (e) { console.error("status set failed", e); }

    // 1) match lineups
    try {
        for (const l of unwrap(await api.getMatchLineups())) {
            if (Number(l.playerId) === playerId) { try { await api.deleteMatchLineup(l.id); out.lineups++; } catch { } }
        }
    } catch { }

    // 2) training sessions (strip from playerIds) + their attendance rows
    try {
        for (const s of unwrap(await api.getTrainingSessions())) {
            const ids = parseIds(s.playerIds);
            if (ids.includes(playerId)) {
                try { await api.updateTrainingSession(s.id, { playerIds: JSON.stringify(ids.filter((x) => x !== playerId)) }); out.sessions++; } catch { }
            }
        }
        for (const a of unwrap(await api.getAttendance())) {
            if (Number(a.playerId) === playerId) { try { await api.deleteAttendance(a.id); out.attendance++; } catch { } }
        }
    } catch { }

    // 3) email + alert every team member
    try {
        const teamId = ctx.teamId ?? ctx.playerTeamMap?.[playerId];
        const name = `${player.firstName || ""} ${player.lastName || ""}`.trim() || `Player #${playerId}`;
        const title = `Squad update: ${name} is injured`;
        const msg = `${name} has been flagged INJURED (restricted) and removed from upcoming matches, lineups and training until cleared by a passing fitness test.`;
        for (const kid of teamRecipients(teamId, playerId, ctx)) {
            try { await api.createNotification({ recipientUserKeycloakId: kid, notificationType: "BOTH", category: "INJURY", status: "PENDING", title, message: msg, relatedEntityType: "PLAYER", relatedEntityId: playerId, emailSubject: title, emailBody: msg, actionUrl: "/dashboard/medical" }); out.notified++; } catch { }
            try { await api.createAlert({ targetUserKeycloakId: kid, title, message: msg, description: msg, alertType: "INJURY_REPORTED", priority: "HIGH", relatedEntityType: "PLAYER", relatedEntityId: playerId }); } catch { }
        }
    } catch (e) { console.error("team notify failed", e); }

    return out;
}

// Passing a fitness test clears the player back to AVAILABLE.
export async function clearInjuredPlayer(player) {
    try { await api.updatePlayerStatus(Number(player.id), "AVAILABLE"); return true; }
    catch (e) { console.error("clear failed", e); return false; }
}

// ─── Self-healing: guarantee an injury has a rehabilitation ──────────────────
// The Recovery stage's POST /recovery-programs REQUIRES a non-null rehabilitationId.
// Normally the Rehabilitation stage creates the rehab record, but an injury can
// reach RECOVERING without one (legacy data / a stage that was skipped), e.g.
// Ansu Fati's calf tear (injury 7 had no rehabilitation). Creating a recovery
// program for such an injury 500s.
//
// ensureRehabilitation looks up the injury's existing rehabilitation; if none
// exists it creates a sensible, fully-populated one (every required field with a
// default) and returns its id. Returns null only if both the lookup and the
// create fail — callers should guard on that.
const DEFAULT_PHYSIO_ID = 6;
const dateOnly = () => new Date().toISOString().split("T")[0];
const isoNow = () => new Date().toISOString();

export async function findRehabForInjury(injuryId) {
    try {
        const list = unwrap(await api.medical.Rehabilitation.get());
        return list.find((r) => String(r.injuryId) === String(injuryId)) || null;
    } catch (e) { console.error("rehab lookup failed", e); return null; }
}

export async function ensureRehabilitation(injury, player, overrides = {}) {
    const injuryId = injury?.id;
    if (!injuryId) return null;

    // 1) reuse an existing rehab for this injury if there is one
    const existing = await findRehabForInjury(injuryId);
    if (existing?.id != null) return Number(existing.id);

    // 2) none exists — create a complete rehabilitation record with defaults so
    //    the recovery program (and the journey) always has one to link to.
    const body = {
        injuryId: Number(injuryId),
        playerId: Number(player?.id ?? injury?.playerId),
        physiotherapistId: DEFAULT_PHYSIO_ID,
        status: "COMPLETED",
        rehabPlan: "Phased return-to-play: pain management, strength, sport-specific, match fit.",
        exercises: "Mobility, progressive strength, balance and sport-specific drills.",
        durationWeeks: 3,
        startDate: dateOnly(),
        expectedEndDate: null,
        actualEndDate: dateOnly(),
        createdAt: isoNow(),
        progressNotes: "Rehabilitation completed; player tolerating full loading.",
        restrictions: "Cleared for non-contact; build contact load gradually.",
        ...overrides,
    };
    try {
        const created = await api.medical.Rehabilitation.post(body);
        const id = created?.id ?? created?.data?.id;
        return id != null ? Number(id) : null;
    } catch (e) {
        console.error("rehab auto-create failed", e);
        return null;
    }
}
