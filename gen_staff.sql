SET client_encoding='UTF8';
BEGIN;
-- 3 staff per new team: Head Coach (30x), Assistant (31x), Fitness (32x).
-- Insert in FK order: user_profiles -> staff -> role tables.
INSERT INTO user_profiles (id, first_name, last_name, role, email, keycloak_id, gender, age, username, created_at, updated_at)
SELECT sid, fn, ln, 'STAFF', 'st'||sid||'@mscms.com', gen_random_uuid()::text, 'MALE', 38+(sid%12), 'st'||sid, now(), now()
FROM (VALUES
  (301,'Xavi','Hernández'),(302,'Sergi','Vidal'),(303,'Jordi','Ribas'),(304,'Albert','Mas'),(305,'Marc','Soler'),
  (311,'Òscar','Grau'),(312,'Pere','Font'),(313,'Iván','Roca'),(314,'Guillem','Sala'),(315,'Toni','Riera'),
  (321,'David','Pons'),(322,'Raúl','Costa'),(323,'Edu','Serra'),(324,'Nil','Camps'),(325,'Aitor','Gual')
) AS v(sid,fn,ln);

INSERT INTO staff (id, sport_id, team_id, staffrole)
SELECT sid, sport_id, team_id, staffrole FROM (VALUES
  (301,1,6,0),(302,2,7,0),(303,6,8,0),(304,5,9,0),(305,5,10,0),
  (311,1,6,1),(312,2,7,1),(313,6,8,1),(314,5,9,1),(315,5,10,1),
  (321,1,6,3),(322,2,7,3),(323,6,8,3),(324,5,9,3),(325,5,10,3)
) AS v(sid,sport_id,team_id,staffrole);

INSERT INTO head_coaches (id, coaching_license_level, staff_role, years_of_experience)
SELECT sid, lic, 'HEAD_COACH', exp FROM (VALUES
  (301,'UEFA Pro',12),(302,'FIBA Level 3',10),(303,'EHF Master',9),(304,'World Aquatics L3',8),(305,'World Aquatics L3',7)
) AS v(sid,lic,exp);

INSERT INTO assistant_coaches (id, specialty, staff_role)
SELECT sid, sp, 'ASSISTANT_COACH' FROM (VALUES
  (311,'Set pieces'),(312,'Defense'),(313,'Wing play'),(314,'Sprint technique'),(315,'Endurance')
) AS v(sid,sp);

INSERT INTO fitness_coaches (id, staff_role)
SELECT sid, 'FITNESS_COACH' FROM (VALUES (321),(322),(323),(324),(325)) AS v(sid);

SELECT setval(pg_get_serial_sequence('user_profiles','id'), (SELECT max(id) FROM user_profiles));
COMMIT;
