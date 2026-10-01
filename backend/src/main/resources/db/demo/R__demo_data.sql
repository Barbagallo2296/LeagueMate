INSERT INTO users (id, username, email, password, first_name, last_name, role)
VALUES (1, 'manuel22', 'manuel@leaguemate.com',
        '$2a$10$ZQ0O6vOM2xUeypi/rxLoT.dqdHWXVMJO4DS6LPvZqEMdJ.T61OuOK',
        'Manuel', 'Barbagallo', 'ADMIN'),
       (2, 'law_organizer', 'law@leaguemate.com',
        '$2a$10$ZQ0O6vOM2xUeypi/rxLoT.dqdHWXVMJO4DS6LPvZqEMdJ.T61OuOK',
        'Trafalgar', 'Law', 'ORGANIZER'),
       (3, 'shanks_player', 'shanks@leaguemate.com',
        '$2a$10$ZQ0O6vOM2xUeypi/rxLoT.dqdHWXVMJO4DS6LPvZqEMdJ.T61OuOK',
        'Shanks', 'LeRoux', 'USER'),
       (4, 'zoro_player', 'zoro@leaguemate.com',
        '$2a$10$ZQ0O6vOM2xUeypi/rxLoT.dqdHWXVMJO4DS6LPvZqEMdJ.T61OuOK',
        'Roronoa', 'Zoro', 'USER')
    ON DUPLICATE KEY UPDATE id = id;

INSERT INTO user_profiles (id, bio, phone_number, avatar_url, user_id)
VALUES (1, 'Full Stack Developer e creatore di LeagueMate', '+39 333 1234567',
        'https://leaguemate.com/avatars/manuel.png', 1),
       (2, 'Organizzatore di tornei amatoriali', '+39 333 7654321',
        'https://leaguemate.com/avatars/law.png', 2),
       (3, 'Attaccante, capitano della Red Hair United', '+39 333 1112223',
        'https://leaguemate.com/avatars/shanks.png', 3),
       (4, 'Difensore centrale', '+39 333 4445556',
        'https://leaguemate.com/avatars/zoro.png', 4)
    ON DUPLICATE KEY UPDATE id = id;

INSERT INTO teams (id, name, logo_url)
VALUES (1, 'Straw Hat FC', 'https://leaguemate.com/logos/strawhat.png'),
       (2, 'Heart Pirates', 'https://leaguemate.com/logos/heart.png'),
       (3, 'Red Hair United', 'https://leaguemate.com/logos/redhair.png'),
       (4, 'Blackbeard City', 'https://leaguemate.com/logos/blackbeard.png')
    ON DUPLICATE KEY UPDATE id = id;

INSERT INTO team_members (id, user_id, team_id, team_role)
VALUES (1, 1, 1, 'CAPTAIN'),
       (2, 4, 1, 'PLAYER'),
       (3, 3, 3, 'CAPTAIN'),
       (4, 2, 2, 'CAPTAIN')
    ON DUPLICATE KEY UPDATE id = id;

UPDATE teams SET owner_id = 1 WHERE id = 1 AND owner_id IS NULL;
UPDATE teams SET owner_id = 2 WHERE id = 2 AND owner_id IS NULL;
UPDATE teams SET owner_id = 3 WHERE id = 3 AND owner_id IS NULL;
UPDATE teams SET owner_id = 2 WHERE id = 4 AND owner_id IS NULL;

INSERT INTO tournaments (id, name, season, status, points_for_win, points_for_draw)
VALUES (1, 'Grand Line Cup', '2026/2027', 'DRAFT', 3, 1)
    ON DUPLICATE KEY UPDATE id = id;

INSERT INTO tournament_registrations (id, team_id, tournament_id, status)
VALUES (1, 1, 1, 'CONFIRMED'),
       (2, 2, 1, 'CONFIRMED'),
       (3, 3, 1, 'CONFIRMED'),
       (4, 4, 1, 'CONFIRMED')
    ON DUPLICATE KEY UPDATE id = id;

INSERT INTO tournament_organizers (tournament_id, user_id)
VALUES (1, 2)
    ON DUPLICATE KEY UPDATE user_id = user_id;

-- ---------------------------------------------------------------------
-- Secondo torneo demo: già in corso, per provare subito classifica,
-- statistiche e funzionalità AI. 8 squadre, sola andata (7 giornate).
-- Giornate 1-3 giocate; nella giornata 4 manca solo
-- Whitebeard Rovers - Straw Hat FC: inserendo quel risultato la giornata
-- si completa e parte la generazione della cronaca.
-- Giornate e partite usano id da 101 in su per non scontrarsi con quelle
-- create da generate-rounds sul torneo 1.
-- ---------------------------------------------------------------------
INSERT INTO teams (id, name, logo_url, owner_id)
VALUES (5, 'Marine Ford', 'https://leaguemate.com/logos/marineford.png', 2),
       (6, 'Kid Pirates', 'https://leaguemate.com/logos/kid.png', 2),
       (7, 'Whitebeard Rovers', 'https://leaguemate.com/logos/whitebeard.png', 2),
       (8, 'Big Mom Pirates', 'https://leaguemate.com/logos/bigmom.png', 2)
    ON DUPLICATE KEY UPDATE id = id;

INSERT INTO tournaments (id, name, season, status, points_for_win, points_for_draw)
VALUES (2, 'New World League', '2026/2027', 'ACTIVE', 3, 1)
    ON DUPLICATE KEY UPDATE id = id;

INSERT INTO tournament_registrations (id, team_id, tournament_id, status)
VALUES (5, 1, 2, 'CONFIRMED'),
       (6, 2, 2, 'CONFIRMED'),
       (7, 3, 2, 'CONFIRMED'),
       (8, 4, 2, 'CONFIRMED'),
       (9, 5, 2, 'CONFIRMED'),
       (10, 6, 2, 'CONFIRMED'),
       (11, 7, 2, 'CONFIRMED'),
       (12, 8, 2, 'CONFIRMED')
    ON DUPLICATE KEY UPDATE id = id;

INSERT INTO tournament_organizers (tournament_id, user_id)
VALUES (2, 2)
    ON DUPLICATE KEY UPDATE user_id = user_id;

INSERT INTO rounds (id, round_number, tournament_id)
VALUES (101, 1, 2),
       (102, 2, 2),
       (103, 3, 2),
       (104, 4, 2),
       (105, 5, 2),
       (106, 6, 2),
       (107, 7, 2)
    ON DUPLICATE KEY UPDATE id = id;

-- Calendario costruito con il metodo del cerchio (Big Mom Pirates fissa):
-- ogni coppia di squadre si incontra una sola volta.
INSERT INTO matches (id, round_id, home_team_id, away_team_id, home_score, away_score, status)
VALUES
-- Giornata 1
(101, 101, 1, 8, 2, 1, 'COMPLETED'),
(102, 101, 2, 7, 1, 1, 'COMPLETED'),
(103, 101, 3, 6, 3, 0, 'COMPLETED'),
(104, 101, 4, 5, 0, 2, 'COMPLETED'),
-- Giornata 2
(105, 102, 8, 2, 1, 0, 'COMPLETED'),
(106, 102, 3, 1, 1, 3, 'COMPLETED'),
(107, 102, 4, 7, 2, 2, 'COMPLETED'),
(108, 102, 5, 6, 1, 0, 'COMPLETED'),
-- Giornata 3
(109, 103, 3, 8, 2, 2, 'COMPLETED'),
(110, 103, 4, 2, 1, 3, 'COMPLETED'),
(111, 103, 5, 1, 1, 1, 'COMPLETED'),
(112, 103, 6, 7, 2, 1, 'COMPLETED'),
-- Giornata 4 (manca Whitebeard Rovers - Straw Hat FC)
(113, 104, 8, 4, 0, 1, 'COMPLETED'),
(114, 104, 5, 3, 2, 0, 'COMPLETED'),
(115, 104, 6, 2, 2, 3, 'COMPLETED'),
(116, 104, 7, 1, NULL, NULL, 'SCHEDULED'),
-- Giornata 5
(117, 105, 5, 8, NULL, NULL, 'SCHEDULED'),
(118, 105, 6, 4, NULL, NULL, 'SCHEDULED'),
(119, 105, 7, 3, NULL, NULL, 'SCHEDULED'),
(120, 105, 1, 2, NULL, NULL, 'SCHEDULED'),
-- Giornata 6
(121, 106, 8, 6, NULL, NULL, 'SCHEDULED'),
(122, 106, 7, 5, NULL, NULL, 'SCHEDULED'),
(123, 106, 1, 4, NULL, NULL, 'SCHEDULED'),
(124, 106, 2, 3, NULL, NULL, 'SCHEDULED'),
-- Giornata 7
(125, 107, 7, 8, NULL, NULL, 'SCHEDULED'),
(126, 107, 1, 6, NULL, NULL, 'SCHEDULED'),
(127, 107, 2, 5, NULL, NULL, 'SCHEDULED'),
(128, 107, 3, 4, NULL, NULL, 'SCHEDULED')
    ON DUPLICATE KEY UPDATE id = id;