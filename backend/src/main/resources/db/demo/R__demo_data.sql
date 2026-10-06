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
        '/avatars/coppa.svg', 1),
       (2, 'Organizzatore di tornei amatoriali', '+39 333 7654321',
        '/avatars/fischietto.svg', 2),
       (3, 'Attaccante, capitano della Red Hair United', '+39 333 1112223',
        '/avatars/fascia.svg', 3),
       (4, 'Difensore centrale', '+39 333 4445556',
        '/avatars/maglia.svg', 4)
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

INSERT INTO matches (id, round_id, home_team_id, away_team_id, home_score, away_score, status)
VALUES
(101, 101, 1, 8, 2, 1, 'COMPLETED'),
(102, 101, 2, 7, 1, 1, 'COMPLETED'),
(103, 101, 3, 6, 3, 0, 'COMPLETED'),
(104, 101, 4, 5, 0, 2, 'COMPLETED'),
(105, 102, 8, 2, 1, 0, 'COMPLETED'),
(106, 102, 3, 1, 1, 3, 'COMPLETED'),
(107, 102, 4, 7, 2, 2, 'COMPLETED'),
(108, 102, 5, 6, 1, 0, 'COMPLETED'),
(109, 103, 3, 8, 2, 2, 'COMPLETED'),
(110, 103, 4, 2, 1, 3, 'COMPLETED'),
(111, 103, 5, 1, 1, 1, 'COMPLETED'),
(112, 103, 6, 7, 2, 1, 'COMPLETED'),
(113, 104, 8, 4, 0, 1, 'COMPLETED'),
(114, 104, 5, 3, 2, 0, 'COMPLETED'),
(115, 104, 6, 2, 2, 3, 'COMPLETED'),
(116, 104, 7, 1, NULL, NULL, 'SCHEDULED'),
(117, 105, 5, 8, NULL, NULL, 'SCHEDULED'),
(118, 105, 6, 4, NULL, NULL, 'SCHEDULED'),
(119, 105, 7, 3, NULL, NULL, 'SCHEDULED'),
(120, 105, 1, 2, NULL, NULL, 'SCHEDULED'),
(121, 106, 8, 6, NULL, NULL, 'SCHEDULED'),
(122, 106, 7, 5, NULL, NULL, 'SCHEDULED'),
(123, 106, 1, 4, NULL, NULL, 'SCHEDULED'),
(124, 106, 2, 3, NULL, NULL, 'SCHEDULED'),
(125, 107, 7, 8, NULL, NULL, 'SCHEDULED'),
(126, 107, 1, 6, NULL, NULL, 'SCHEDULED'),
(127, 107, 2, 5, NULL, NULL, 'SCHEDULED'),
(128, 107, 3, 4, NULL, NULL, 'SCHEDULED')
    ON DUPLICATE KEY UPDATE id = id;

INSERT INTO users (id, username, email, password, first_name, last_name, role)
VALUES (5, 'smoker_organizer', 'smoker@leaguemate.com',
        '$2a$10$ZQ0O6vOM2xUeypi/rxLoT.dqdHWXVMJO4DS6LPvZqEMdJ.T61OuOK',
        'Smoker', 'Hunter', 'ORGANIZER'),
       (6, 'nami_player', 'nami@leaguemate.com',
        '$2a$10$ZQ0O6vOM2xUeypi/rxLoT.dqdHWXVMJO4DS6LPvZqEMdJ.T61OuOK',
        'Nami', 'Navigatrice', 'USER'),
       (7, 'sanji_player', 'sanji@leaguemate.com',
        '$2a$10$ZQ0O6vOM2xUeypi/rxLoT.dqdHWXVMJO4DS6LPvZqEMdJ.T61OuOK',
        'Vinsmoke', 'Sanji', 'USER'),
       (8, 'robin_player', 'robin@leaguemate.com',
        '$2a$10$ZQ0O6vOM2xUeypi/rxLoT.dqdHWXVMJO4DS6LPvZqEMdJ.T61OuOK',
        'Nico', 'Robin', 'USER'),
       (9, 'boop', 'boop@leaguemate.com',
        '$2a$10$ZQ0O6vOM2xUeypi/rxLoT.dqdHWXVMJO4DS6LPvZqEMdJ.T61OuOK',
        'Lami', 'Boop', 'ADMIN')
    ON DUPLICATE KEY UPDATE id = id;

INSERT INTO user_profiles (id, bio, phone_number, avatar_url, user_id)
VALUES (5, 'Organizzatore del Wano Trophy e della Paradise Cup', '+39 333 2223334', NULL, 5),
       (6, 'Ala sinistra, la più veloce della squadra', '+39 333 5556667', NULL, 6),
       (7, 'Centrocampista, specialista dei calci piazzati', '+39 333 8889990', NULL, 7),
       (8, 'Portiere di riserva e analista delle partite', '+39 333 3334445', NULL, 8),
       (9, 'Tifosa della New World League, non si perde una giornata', '+39 333 6667778',
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTiLKlCWyVsMB-_g3UhRKvMvFOfP0IW62-_8BLufQ6STg&s=10', 9)
    ON DUPLICATE KEY UPDATE id = id;

INSERT INTO teams (id, name, logo_url, owner_id)
VALUES (9, 'Navy Blues', NULL, 5),
       (10, 'Baratie United', NULL, 5),
       (11, 'Arlong Park', NULL, 5),
       (12, 'Sabaody Stars', NULL, 5)
    ON DUPLICATE KEY UPDATE id = id;

INSERT INTO team_members (id, user_id, team_id, team_role)
VALUES (5, 6, 1, 'PLAYER'),
       (6, 7, 1, 'PLAYER'),
       (7, 8, 1, 'RESERVE'),
       (8, 5, 9, 'CAPTAIN')
    ON DUPLICATE KEY UPDATE id = id;

INSERT INTO tournaments (id, name, season, status, points_for_win, points_for_draw)
VALUES (3, 'Paradise Cup', '2025/2026', 'COMPLETED', 3, 1),
       (4, 'Wano Trophy', '2026/2027', 'ACTIVE', 3, 1)
    ON DUPLICATE KEY UPDATE id = id;

INSERT INTO tournament_registrations (id, team_id, tournament_id, status)
VALUES (13, 1, 3, 'CONFIRMED'),
       (14, 9, 3, 'CONFIRMED'),
       (15, 10, 3, 'CONFIRMED'),
       (16, 11, 3, 'CONFIRMED'),
       (17, 9, 4, 'CONFIRMED'),
       (18, 10, 4, 'CONFIRMED'),
       (19, 11, 4, 'CONFIRMED'),
       (20, 12, 4, 'CONFIRMED'),
       (21, 3, 4, 'CONFIRMED'),
       (22, 6, 4, 'CONFIRMED')
    ON DUPLICATE KEY UPDATE id = id;

INSERT INTO tournament_organizers (tournament_id, user_id)
VALUES (3, 5),
       (4, 5),
       (4, 2)
    ON DUPLICATE KEY UPDATE user_id = user_id;

INSERT INTO rounds (id, round_number, tournament_id)
VALUES (201, 1, 3),
       (202, 2, 3),
       (203, 3, 3),
       (301, 1, 4),
       (302, 2, 4),
       (303, 3, 4),
       (304, 4, 4),
       (305, 5, 4)
    ON DUPLICATE KEY UPDATE id = id;

INSERT INTO matches (id, round_id, home_team_id, away_team_id, home_score, away_score, status)
VALUES
(201, 201, 1, 9, 2, 1, 'COMPLETED'),
(202, 201, 10, 11, 1, 1, 'COMPLETED'),
(203, 202, 9, 10, 0, 2, 'COMPLETED'),
(204, 202, 11, 1, 1, 3, 'COMPLETED'),
(205, 203, 1, 10, 2, 2, 'COMPLETED'),
(206, 203, 11, 9, 0, 1, 'COMPLETED'),
(301, 301, 9, 6, 1, 0, 'COMPLETED'),
(302, 301, 10, 3, 2, 2, 'COMPLETED'),
(303, 301, 11, 12, 0, 3, 'COMPLETED'),
(304, 302, 9, 3, 1, 2, 'COMPLETED'),
(305, 302, 6, 12, 1, 1, 'COMPLETED'),
(306, 302, 10, 11, 4, 1, 'COMPLETED'),
(307, 303, 9, 12, NULL, NULL, 'SCHEDULED'),
(308, 303, 3, 11, NULL, NULL, 'SCHEDULED'),
(309, 303, 6, 10, NULL, NULL, 'SCHEDULED'),
(310, 304, 9, 11, NULL, NULL, 'SCHEDULED'),
(311, 304, 12, 10, NULL, NULL, 'SCHEDULED'),
(312, 304, 3, 6, NULL, NULL, 'SCHEDULED'),
(313, 305, 9, 10, NULL, NULL, 'SCHEDULED'),
(314, 305, 11, 6, NULL, NULL, 'SCHEDULED'),
(315, 305, 12, 3, NULL, NULL, 'SCHEDULED')
    ON DUPLICATE KEY UPDATE id = id;
