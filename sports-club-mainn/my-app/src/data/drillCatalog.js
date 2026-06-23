// Big static drill catalogue, grouped by sport. The Training module picks drills
// from here when building a session; the chosen ones are created as real
// TrainingDrill records on the backend. `category` values are valid backend
// DrillCategory enum constants. `minutes` is the default drill length.

export const DRILL_CATALOG = {
  FOOTBALL: [
    { name: "Dynamic Warm-up & Mobility", category: "WARMUP", minutes: 12, intensity: 4, equipment: "Cones", description: "Joint mobility, activation and light running.", instructions: "Progress from jogging to dynamic stretches and short accelerations." },
    { name: "Rondo 5v2 Possession", category: "PASSING_DRILL", minutes: 15, intensity: 6, equipment: "Bibs, balls", description: "Quick one-touch possession in a tight square.", instructions: "Two defenders press; outside players keep the ball with max two touches." },
    { name: "Positional Possession 7v7+3", category: "TACTICAL", minutes: 20, intensity: 7, equipment: "Cones, bibs, balls", description: "Build-up play through thirds with neutrals.", instructions: "Switch play to the free side; reward 8+ pass sequences." },
    { name: "Finishing from Cutbacks", category: "SHOOTING_DRILL", minutes: 15, intensity: 7, equipment: "Balls, goals", description: "Wide overlap then cut-back finish.", instructions: "Two lines: winger drives byline, striker attacks the cutback first-time." },
    { name: "Defensive Shape & Pressing Triggers", category: "DEFENDING_DRILL", minutes: 18, intensity: 6, equipment: "Cones, bibs", description: "Compact block and coordinated pressing.", instructions: "Press on the back-pass trigger; hold a tight line of four." },
    { name: "Attacking Set Pieces", category: "SET_PLAYS", minutes: 12, intensity: 5, equipment: "Balls, mannequins", description: "Corner and free-kick routines.", instructions: "Rehearse near-post flick and second-phase positioning." },
    { name: "Small-Sided Game 6v6", category: "TACTICAL", minutes: 20, intensity: 8, equipment: "Goals, bibs", description: "Game realism with conditions.", instructions: "Two-touch limit in own half; full freedom in the final third." },
    { name: "Speed & Agility Ladders", category: "AGILITY_DRILL", minutes: 12, intensity: 7, equipment: "Ladder, cones", description: "Footwork, change of direction.", instructions: "Quick feet through the ladder into a 5m sprint and decelerate." },
    { name: "High-Intensity Interval Running", category: "FITNESS", minutes: 16, intensity: 9, equipment: "Cones, GPS vests", description: "Repeated 30:30 runs.", instructions: "30s near-max run, 30s recovery × 12. Track distances." },
    { name: "Cool-down & Stretching", category: "COOLDOWN", minutes: 10, intensity: 2, equipment: "Mats", description: "Static stretching and breathing.", instructions: "Hold each stretch 20–30s; light foam rolling." },
  ],
  BASKETBALL: [
    { name: "Dynamic Warm-up", category: "WARMUP", minutes: 10, intensity: 4, equipment: "—", description: "Activation and mobility.", instructions: "Defensive slides, high knees, lunges with reach." },
    { name: "Form Shooting Progression", category: "SHOOTING_DRILL", minutes: 15, intensity: 5, equipment: "Balls, hoop", description: "Spot shooting from close to range.", instructions: "Make 5 at each spot before moving out; balance and follow-through." },
    { name: "Pick & Roll Reads", category: "TACTICAL", minutes: 18, intensity: 7, equipment: "Balls", description: "Ball-handler and screener decisions.", instructions: "Read drop vs hedge; finish, pocket-pass or pop." },
    { name: "3-Man Weave to Finish", category: "PASSING_DRILL", minutes: 12, intensity: 6, equipment: "Balls", description: "Passing on the move and layups.", instructions: "Pass-and-follow full court into a controlled finish." },
    { name: "Defensive Slides & Closeouts", category: "DEFENDING_DRILL", minutes: 14, intensity: 7, equipment: "Cones", description: "Lateral defense and contesting.", instructions: "Slide the lane, sprint-closeout with high hands, no fouls." },
    { name: "Transition 3v2 / 2v1", category: "TRANSITION_PLAY", minutes: 16, intensity: 8, equipment: "Balls", description: "Fast-break decision making.", instructions: "Advantage situations; make the right pass before help arrives." },
    { name: "Box-out & Rebounding Battle", category: "REBOUNDING_DRILL", minutes: 12, intensity: 7, equipment: "Balls", description: "Contact, position and the board.", instructions: "Find a body, box out, secure with two hands." },
    { name: "Conditioning Suicides", category: "FITNESS", minutes: 10, intensity: 9, equipment: "—", description: "Repeated baseline-to-line sprints.", instructions: "Touch each line; track times across sets." },
    { name: "Free-throw Routine & Cooldown", category: "COOLDOWN", minutes: 8, intensity: 2, equipment: "Balls", description: "Calm free throws then stretch.", instructions: "10 free throws with full routine, then static stretching." },
  ],
  HANDBALL: [
    { name: "Mobility & Ball Warm-up", category: "WARMUP", minutes: 10, intensity: 4, equipment: "Balls", description: "Shoulder care and handling.", instructions: "Partner passing with progressive intensity and shoulder activation." },
    { name: "Wing Fast-break Finishing", category: "SHOOTING_DRILL", minutes: 14, intensity: 7, equipment: "Balls, goal", description: "Counter-attack wing shots.", instructions: "Outlet to wing, finish under the angle vs keeper." },
    { name: "6-0 Defensive Block Movement", category: "DEFENDING_DRILL", minutes: 16, intensity: 6, equipment: "—", description: "Shifting and blocking as a unit.", instructions: "Step out to the ball, recover, communicate switches." },
    { name: "Backcourt Combination Play", category: "TACTICAL", minutes: 18, intensity: 7, equipment: "Balls", description: "Crossings and pivot interplay.", instructions: "Run cross with the pivot; create the gap for the jump shot." },
    { name: "Goalkeeper Reaction Series", category: "TECHNICAL", minutes: 12, intensity: 6, equipment: "Balls, goal", description: "Reflex and angle work for keepers.", instructions: "Rapid shots at varied heights; reset stance each rep." },
    { name: "7v6 Power-play Patterns", category: "SET_PLAYS", minutes: 12, intensity: 6, equipment: "Balls", description: "Extra-attacker organisation.", instructions: "Move the empty-goal numbers; finish the overload." },
    { name: "Intermittent Court Conditioning", category: "FITNESS", minutes: 14, intensity: 9, equipment: "Cones", description: "Repeated sprints with changes of direction.", instructions: "Court-length runs with defensive shuffles between reps." },
    { name: "Cool-down & Shoulder Stretch", category: "COOLDOWN", minutes: 8, intensity: 2, equipment: "Bands", description: "Recovery for throwing shoulders.", instructions: "Band work and static stretches for shoulder and back." },
  ],
  TENNIS: [
    { name: "Dynamic Warm-up & Mini-tennis", category: "WARMUP", minutes: 10, intensity: 3, equipment: "Rackets, balls", description: "Activation and touch within the service boxes.", instructions: "Short rallies focusing on clean contact and footwork." },
    { name: "Cross-court Forehand Consistency", category: "STROKE_TECHNIQUE", minutes: 15, intensity: 6, equipment: "Rackets, basket", description: "Depth and shape on the forehand.", instructions: "20-ball baskets, aim past the service line, heavy topspin." },
    { name: "Backhand Down-the-line", category: "STROKE_TECHNIQUE", minutes: 15, intensity: 6, equipment: "Rackets, basket", description: "Directional change on the backhand.", instructions: "Recover to center after each ball; target the corner." },
    { name: "Serve Placement Targets", category: "SERVE_PRACTICE", minutes: 15, intensity: 5, equipment: "Rackets, balls, targets", description: "Wide / body / T placement.", instructions: "5 serves to each target both boxes; track make %." },
    { name: "Return & First-strike Patterns", category: "TACTICAL", minutes: 14, intensity: 7, equipment: "Rackets, balls", description: "Return then attack the third ball.", instructions: "Block return deep, step in on the next ball." },
    { name: "Approach & Volley Combos", category: "TECHNICAL", minutes: 12, intensity: 6, equipment: "Rackets, balls", description: "Transition to the net.", instructions: "Approach down the line, split-step, put away the volley." },
    { name: "Live-ball Point Play", category: "TACTICAL", minutes: 16, intensity: 8, equipment: "Rackets, balls", description: "Pressure points with scoring.", instructions: "Play tiebreaks; enforce a pattern before going for winners." },
    { name: "Footwork & Agility", category: "AGILITY_DRILL", minutes: 10, intensity: 7, equipment: "Cones, ladder", description: "Court movement and recovery steps.", instructions: "Spider runs and split-step timing drills." },
    { name: "Cooldown & Stretch", category: "COOLDOWN", minutes: 8, intensity: 2, equipment: "Mats", description: "Recovery stretching.", instructions: "Static stretches for legs, shoulder and forearm." },
  ],
};

// Order the sports are shown in (a line divider is rendered between groups).
export const DRILL_SPORT_ORDER = ["FOOTBALL", "BASKETBALL", "HANDBALL", "TENNIS"];

// Map a TrainingType to the drill sports it makes sense to pick from (all, for now).
export function catalogForSport(sport) {
  return DRILL_CATALOG[String(sport || "").toUpperCase()] || [];
}
