SET client_encoding='UTF8';
BEGIN;
-- Squad per new team (explicit ids, above current max=90):
--   team 6 Atlètic 201-214(14), 7 Bàsquet B 221-230(10),
--   8 Handbol B 241-252(12), 9 Natació 261-268(8), 10 Natació B 271-278(8)
WITH cfg AS (
  SELECT t.team_id, gs, (t.base+gs) AS pid
  FROM (VALUES (6,201,14),(7,221,10),(8,241,12),(9,261,8),(10,271,8)) AS t(team_id,base,cnt)
  CROSS JOIN LATERAL generate_series(0, t.cnt-1) AS gs
)
INSERT INTO user_profiles (id, first_name, last_name, role, email, keycloak_id, gender, age, username, created_at, updated_at)
SELECT pid,
  (ARRAY['Marc','Pau','Jordi','Sergi','Aleix','Oriol','Gerard','Arnau','Pol','Bernat','Iker','Hugo','Nico','Martí','Roger','Biel','Eric','Adrià','Joel','Lluc'])[1+(pid%20)],
  (ARRAY['Garcia','Soler','Martí','Vidal','Roca','Costa','Serra','Bosch','Ferrer','Pons','Vila','Mas','Sala','Camps','Riera','Gual','Prat','Ros','Pujol','Bru'])[1+((pid/2)%20)],
  'PLAYER', 'np'||pid||'@mscms.com', gen_random_uuid()::text, 'MALE', 18+(pid%15), 'np'||pid, now(), now()
FROM cfg;

WITH cfg AS (
  SELECT t.team_id, gs, (t.base+gs) AS pid
  FROM (VALUES (6,201,14),(7,221,10),(8,241,12),(9,261,8),(10,271,8)) AS t(team_id,base,cnt)
  CROSS JOIN LATERAL generate_series(0, t.cnt-1) AS gs
)
INSERT INTO players (id, status, preferred_position, nationality, kit_number, market_value, date_of_birth)
SELECT pid, 'AVAILABLE', (pid%34),
  (ARRAY['Spanish','Catalan','French','Portuguese','Brazilian','Argentine','Dutch','German','Italian','Moroccan'])[1+(pid%10)],
  gs+1, (5+(pid%40))*1000000, DATE '1995-01-01' + ((pid*37)%3000)
FROM cfg;

SELECT setval(pg_get_serial_sequence('user_profiles','id'), (SELECT max(id) FROM user_profiles));
COMMIT;
