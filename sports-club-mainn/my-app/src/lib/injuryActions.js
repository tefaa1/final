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
