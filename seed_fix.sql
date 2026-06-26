SET client_encoding='UTF8';
BEGIN;

-- 1a) Give every session its assigned squad in player_ids (JSON array the
--     attendance screen reads), derived from the attendances we created.
UPDATE training_sessions s SET player_ids = sub.ids
FROM (
  SELECT training_session_id, '['||string_agg(DISTINCT player_id::text, ',')||']' AS ids
  FROM training_attendances GROUP BY training_session_id
) sub
WHERE s.id = sub.training_session_id
  AND (s.player_ids IS NULL OR s.player_ids = '' OR s.player_ids = '[]');

-- 1b) Upcoming (SCHEDULED) sessions: keep the squad in player_ids but clear
--     the pre-filled attendance, so opening one shows the players UNMARKED,
--     ready for you to take attendance.  COMPLETED/ONGOING keep their marks.
DELETE FROM training_attendances
WHERE training_session_id IN (SELECT id FROM training_sessions WHERE status = 'SCHEDULED');

-- 2) Build each plan's sessionSlots (what the plan view lists) from its
--    linked sessions: [{"name":"Session 1","date":"YYYY-MM-DD","sessionId":id}, ...]
UPDATE training_plans p SET session_slots = sub.slots
FROM (
  SELECT training_plan_id,
    '['||string_agg(
        json_build_object('name','Session '||rn, 'date', d, 'sessionId', sid)::text,
        ',' ORDER BY rn)||']' AS slots
  FROM (
    SELECT training_plan_id, id AS sid,
           to_char(scheduled_date_time,'YYYY-MM-DD') AS d,
           row_number() OVER (PARTITION BY training_plan_id ORDER BY scheduled_date_time) AS rn
    FROM training_sessions WHERE training_plan_id IS NOT NULL
  ) z GROUP BY training_plan_id
) sub
WHERE p.id = sub.training_plan_id;

COMMIT;
