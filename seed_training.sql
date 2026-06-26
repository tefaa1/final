SET client_encoding='UTF8';
BEGIN;

-- =====================================================================
-- 1) Link existing sessions to plans  (guard: session date inside the
--    plan's [start_date, end_date] range AND same team).  Only sessions
--    not yet linked.
-- =====================================================================
-- team 1 plans: 1 Pre-Clásico(06-13..06-27), 2 Fitness(05-21..07-04),
--               4 Pre-season(06-15..07-15), 5 La Liga(06-01..06-30),
--               6 Youth(06-10..08-10)
UPDATE training_sessions SET training_plan_id=1
 WHERE training_plan_id IS NULL AND team_id=1 AND training_type='TACTICAL'
   AND scheduled_date_time::date BETWEEN '2026-06-13' AND '2026-06-27';
UPDATE training_sessions SET training_plan_id=2
 WHERE training_plan_id IS NULL AND team_id=1 AND training_type IN ('FITNESS','RECOVERY')
   AND scheduled_date_time::date BETWEEN '2026-05-21' AND '2026-07-04';
UPDATE training_sessions SET training_plan_id=5
 WHERE training_plan_id IS NULL AND team_id=1 AND training_type IN ('TECHNICAL','VIDEO_ANALYSIS')
   AND scheduled_date_time::date BETWEEN '2026-06-01' AND '2026-06-30';
UPDATE training_sessions SET training_plan_id=4
 WHERE training_plan_id IS NULL AND team_id=1
   AND scheduled_date_time::date BETWEEN '2026-06-15' AND '2026-07-15';
-- team 2 plans: 3 Pre-Season(04-21..05-31, completed), 7 EuroLeague(06-12..07-12)
UPDATE training_sessions SET training_plan_id=7
 WHERE training_plan_id IS NULL AND team_id=2
   AND scheduled_date_time::date BETWEEN '2026-06-12' AND '2026-07-12';

-- =====================================================================
-- 2) New sessions: future ones (today = 2026-06-24) for teams 1 & 2,
--    each inside its plan's range; plus a couple of completed May
--    sessions for plan 3 so it is not empty.
-- =====================================================================
INSERT INTO training_sessions
  (training_plan_id, team_id, scheduled_date_time, duration_minutes, status, training_type, location, objectives)
VALUES
  -- team 1 future
  (2,1,'2026-06-26 10:00:00',75,'SCHEDULED','FITNESS',       'Ciutat Esportiva','Aerobic base and strength'),
  (4,1,'2026-06-27 10:00:00',90,'SCHEDULED','TACTICAL',      'Ciutat Esportiva','Pressing structure and shape'),
  (4,1,'2026-06-29 16:00:00',60,'SCHEDULED','TECHNICAL',     'Ciutat Esportiva','Finishing and combinations'),
  (2,1,'2026-07-01 10:00:00',60,'SCHEDULED','RECOVERY',      'Ciutat Esportiva','Recovery and mobility'),
  (6,1,'2026-07-03 10:00:00',90,'SCHEDULED','TACTICAL',      'Ciutat Esportiva','Youth integration tactics'),
  (6,1,'2026-07-06 11:00:00',75,'SCHEDULED','TECHNICAL',     'Ciutat Esportiva','Technical circuit'),
  (4,1,'2026-07-08 16:00:00',60,'SCHEDULED','VIDEO_ANALYSIS','Video room',      'Opponent review'),
  (6,1,'2026-07-10 10:00:00',90,'SCHEDULED','FITNESS',       'Ciutat Esportiva','Conditioning block'),
  -- team 2 future
  (7,2,'2026-06-27 18:00:00',75,'SCHEDULED','TACTICAL',      'Palau Blaugrana','Pick and roll defense'),
  (7,2,'2026-06-30 18:00:00',60,'SCHEDULED','TECHNICAL',     'Palau Blaugrana','Shooting mechanics'),
  (7,2,'2026-07-04 18:00:00',60,'SCHEDULED','FITNESS',       'Palau Blaugrana','Court conditioning'),
  (7,2,'2026-07-09 17:00:00',45,'SCHEDULED','VIDEO_ANALYSIS','Video room',     'EuroLeague preparation'),
  -- team 2 completed (plan 3, May)
  (3,2,'2026-05-12 18:00:00',75,'COMPLETED','FITNESS',  'Palau Blaugrana','Pre-season conditioning'),
  (3,2,'2026-05-22 18:00:00',60,'COMPLETED','TECHNICAL','Palau Blaugrana','Ball-handling and shooting');

-- =====================================================================
-- 3) Drills for every session that has none.  Durations are a fraction
--    of the session length so the SUM is always < session duration
--    (guard).  Categories are valid for the training type.
-- =====================================================================
INSERT INTO training_drills
  (training_session_id, drill_name, category, duration_minutes, intensity, order_in_session, description)
SELECT s.id, d.name, d.cat, GREATEST(10,(s.duration_minutes*d.frac)::int), d.intensity, d.ord, d.descr
FROM training_sessions s
JOIN (VALUES
  ('TACTICAL',      'Possession circuit',     'PASSING_DRILL',   0.20, 6, 1, 'High-tempo possession in tight spaces'),
  ('TACTICAL',      'Positional play',        'TACTICAL',        0.35, 7, 2, 'Pattern play and shape through the thirds'),
  ('FITNESS',       'Interval running',       'FITNESS',         0.40, 8, 1, 'Repeated high-intensity intervals'),
  ('FITNESS',       'Strength and core',      'AGILITY_DRILL',   0.25, 6, 2, 'Strength, stability and agility stations'),
  ('TECHNICAL',     'Finishing and shooting', 'SHOOTING_DRILL',  0.30, 7, 1, 'Finishing under pressure'),
  ('TECHNICAL',     '1v1 skills',             'DRIBBLING_DRILL', 0.25, 6, 2, 'One-versus-one skill work'),
  ('RECOVERY',      'Mobility and stretching','RECOVERY',        0.45, 3, 1, 'Active recovery and mobility'),
  ('VIDEO_ANALYSIS','Opponent analysis',      'VIDEO_ANALYSIS',  0.50, 2, 1, 'Reviewing opponent patterns on video')
) AS d(ttype, name, cat, frac, intensity, ord, descr)
  ON d.ttype = s.training_type
WHERE NOT EXISTS (SELECT 1 FROM training_drills td WHERE td.training_session_id = s.id);

-- =====================================================================
-- 4) Random player subsets (NOT all players) for every session that has
--    no attendances yet.  random()<threshold picks a varying subset;
--    status is mostly PRESENT with a few LATE/EXCUSED/INJURED.
-- =====================================================================
-- team 1 pool (20 players)
INSERT INTO training_attendances (training_session_id, player_id, status)
SELECT s.id, p.pid,
       CASE WHEN random()<0.80 THEN 'PRESENT'
            WHEN random()<0.50 THEN 'LATE'
            WHEN random()<0.50 THEN 'EXCUSED'
            ELSE 'INJURED' END
FROM training_sessions s
CROSS JOIN unnest(ARRAY[12,13,14,15,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39]) AS p(pid)
WHERE s.team_id=1
  AND NOT EXISTS (SELECT 1 FROM training_attendances a WHERE a.training_session_id=s.id)
  AND random() < 0.65;

-- team 2 pool (10 players)
INSERT INTO training_attendances (training_session_id, player_id, status)
SELECT s.id, p.pid,
       CASE WHEN random()<0.80 THEN 'PRESENT'
            WHEN random()<0.50 THEN 'LATE'
            WHEN random()<0.50 THEN 'EXCUSED'
            ELSE 'INJURED' END
FROM training_sessions s
CROSS JOIN unnest(ARRAY[16,44,45,46,47,48,49,50,51,52]) AS p(pid)
WHERE s.team_id=2
  AND NOT EXISTS (SELECT 1 FROM training_attendances a WHERE a.training_session_id=s.id)
  AND random() < 0.70;

COMMIT;
