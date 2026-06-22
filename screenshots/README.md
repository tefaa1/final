# Documentation Screenshots

Drop PNG files into this folder using the exact filenames below; the
LaTeX `\screenshot{...}` calls in `DOCUMENTATION.tex` will pick them
up automatically on the next `pdflatex` run. Any filename that does
**not** exist renders as a labelled placeholder frame instead, so the
document always compiles.

## Onboarding & Auth
- `onboarding.png` — landing page with Barcelona-themed hero
- `login.png` — login form (any of the 19 roles)

## Admin
- `admin-dashboard.png` — counts aggregated across 6 services
- `admin-users.png` — Users Management page (Keycloak-backed)
- `admin-staff.png` — Staff Management page
- `notifications-admin.png` — broadcast view with priority chips

## Sport Manager
- `sport-mgr-dashboard.png` — cross-discipline KPIs
- `transfers.png` — Incoming / Outgoing / Call-up tabs
- `sponsors.png` — Spotify / Nike / Damm / Beko pipeline

## Team Manager
- `team-mgr-dashboard.png` — single-team cockpit
- `players.png` — roster CRUD with discipline filter
- `teams.png` — five-discipline directory
- `matches.png` — match status pipeline

## Head Coach & Assistants
- `coach-dashboard.png`
- `training.png` — plans / sessions / drills / attendance
- `formations.png` — tactical board

## Medical Staff
- `medical-dashboard.png`
- `injuries.png` — injury + diagnosis + treatment + rehab side panel
- `fitness-load.png` — fitness tests and load trend

## Scout
- `outer-players.png` — external prospects catalogue
- `scout-reports.png` — five-axis radar chart

## Sponsor
- `sponsor-page.png` — sponsor's own contracts and offers

## Performance Analyst
- `analytics.png` — Overview aggregating 5 APIs
- `match-analysis.png` — narrative-plus-metrics layout
- `ai-match-predict.png` — match prediction probabilities
- `ai-player-rating.png` — player rating predicted vs. actual
- `reports.png` — download-to-`.txt` actions

## Player
- `player-dashboard.png` — personal cockpit

## Fan
- `fan-dashboard.png` — public club hub
- `fan-pages.png` — fan view of Matches (Add/Edit suppressed)

## Cross-cutting
- `notifications-panel.png` — navbar bell panel
- `settings.png` — Profile tab driven by JWT

## Recommended capture settings
- Width: 1440px (display will downscale to 0.85 * text width)
- Format: PNG, 72–96 DPI
- Browser zoom: 100%
- Show the sidebar so the role is visible in each shot
