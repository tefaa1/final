SET client_encoding='UTF8';
-- Link the new players to their teams via the roster (same ids as gen_players_user.sql)
INSERT INTO rosters (player_id, season, team_id)
SELECT (t.base+gs), '2025/26', t.team_id
FROM (VALUES (6,201,14),(7,221,10),(8,241,12),(9,261,8),(10,271,8)) AS t(team_id,base,cnt)
CROSS JOIN LATERAL generate_series(0, t.cnt-1) AS gs;
