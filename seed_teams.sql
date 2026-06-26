SET client_encoding='UTF8';
-- Second team per non-tennis sport (idempotent by name).
-- sports: 1 Football, 2 Basketball, 3 Tennis(skip), 5 Swimming, 6 Handball
INSERT INTO "tables"(name, country, sport_id)
SELECT v.name, v.country, v.sport_id FROM (VALUES
  ('FC Barcelona Atlètic',  'Spain', 1::bigint),   -- football reserve team
  ('FC Barcelona Bàsquet B','Spain', 2::bigint),   -- basketball B team
  ('FC Barcelona Handbol B','Spain', 6::bigint),   -- handball B team
  ('FC Barcelona Natació',  'Spain', 5::bigint),   -- swimming (had none)
  ('FC Barcelona Natació B','Spain', 5::bigint)    -- swimming second
) AS v(name, country, sport_id)
WHERE NOT EXISTS (SELECT 1 FROM "tables" t WHERE t.name = v.name);

SELECT s.sport_type, count(t.id) AS teams, string_agg(t.name, ', ' ORDER BY t.id) AS team_names
FROM sports s LEFT JOIN "tables" t ON t.sport_id = s.id
GROUP BY s.id, s.sport_type ORDER BY s.id;
