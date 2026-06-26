# 📸 Screenshots to take for the Sportify deck

Take each screenshot, name it **exactly** as below (case-sensitive), and drop it into
`D:\Project-final-repo\documentation\screenshots\`. Then tell me to rebuild — each
placeholder slide auto-fills with your image (the deck checks the file on build).

Tip: capture at a wide 16:9-ish browser window, full page area, no browser chrome if possible.

## A) One screenshot per FEATURE (each feature has its own slide + a screen after it)

| # | Filename | What to capture |
|---|----------|-----------------|
| 1 | `shot-dashboards.png`     | The role-aware **Dashboard** landing page (an admin or coach dashboard) |
| 2 | `shot-teams.png`          | **Teams & Sports** page showing the multi-sport / multi-team squads |
| 3 | `shot-competitions.png`   | **Competitions** — La Liga table or the Champions League league-phase |
| 4 | `shot-livematch.png`      | **Live Match** engine running (clock + events + add-event panel) |
| 5 | `shot-injury.png`         | A player's **medical recovery journey** (the staged lifecycle) — *already have `new-medical-lifecycle.PNG`, retake only if you want* |
| 6 | `shot-training.png`       | A **training plan** with its sessions, drills and attendance |
| 7 | `shot-scouting.png`       | **Scouting** report page (and/or a sponsor-offer negotiation) |
| 8 | `shot-messaging.png`      | **Team chat / Messages** (a group conversation) |
| 9 | `shot-analytics.png`      | **Analytics** or **ML Match Predictor / Player Rating** screen |
| 10 | `shot-notifications.png` | The **notifications bell** open, or the **Alerts** center |

## B) One screenshot per ROLE LOGIN (to show "every role sees its own view")

Log in with each demo account (all passwords `password123`, admin is `admin123`),
screenshot the **dashboard + sidebar** you land on, and name it as below:

| Filename | Log in as | Shows |
|----------|-----------|-------|
| `shot-view-admin.png`        | `admin` / `admin123`      | Full admin view (all sections) |
| `shot-view-sportmanager.png` | `sportmanager` / `password123` | Sport-manager view |
| `shot-view-headcoach.png`    | `headcoach` / `password123`    | Head-coach view |
| `shot-view-doctor.png`       | `doctor` / `password123`       | Medical / doctor view |
| `shot-view-scout.png`        | `scout` / `password123`        | Scout view |
| `shot-view-player.png`       | `player1` / `password123`      | Player (read-only) view |
| `shot-view-fan.png`          | `fan` / `password123`          | Fan (spectator-only) view |

> Take the role-view screenshots **after** the role fix lands, so each sidebar correctly
> shows only that role's sections.
