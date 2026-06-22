// Players don't carry an explicit sportType — their sport is implied by their
// preferredPosition. This is the single source of truth used across the app.
export const SPORT_BY_POSITION = {
  GOALKEEPER: "Football", RIGHT_BACK: "Football", LEFT_BACK: "Football",
  CENTER_BACK: "Football", DEFENSIVE_MID: "Football", CENTRAL_MID: "Football",
  ATTACKING_MID: "Football", RIGHT_WING: "Football", LEFT_WING: "Football", STRIKER: "Football",
  POINT_GUARD: "Basketball", SHOOTING_GUARD: "Basketball", SMALL_FORWARD: "Basketball",
  POWER_FORWARD: "Basketball", CENTER: "Basketball",
  HB_GOALKEEPER: "Handball", HB_LEFT_WING: "Handball", HB_RIGHT_WING: "Handball",
  HB_LEFT_BACK: "Handball", HB_RIGHT_BACK: "Handball", HB_CENTRE_BACK: "Handball",
  HB_PIVOT: "Handball",
  SINGLES_PLAYER: "Tennis", DOUBLES_PLAYER: "Tennis",
  SETTER: "Volleyball", OUTSIDE_HITTER: "Volleyball", OPPOSITE_HITTER: "Volleyball",
  MIDDLE_BLOCKER: "Volleyball", LIBERO: "Volleyball", DEFENSIVE_SPECIALIST: "Volleyball",
  FREESTYLE_SWIMMER: "Swimming", BACKSTROKE_SWIMMER: "Swimming",
  BREASTSTROKE_SWIMMER: "Swimming", BUTTERFLY_SWIMMER: "Swimming", MEDLEY_SWIMMER: "Swimming",
};

// Returns a Title-case sport ("Football", "Basketball", …) or "General".
export function resolveSport(position) {
  if (!position) return "General";
  return SPORT_BY_POSITION[String(position).toUpperCase().trim()] || "General";
}

// UPPERCASE sport ("FOOTBALL") to compare against a match's sportType.
export function resolveSportUpper(position) {
  return resolveSport(position).toUpperCase();
}
