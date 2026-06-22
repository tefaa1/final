package com.example.usermanagementservice.bootstrap;

import com.example.usermanagementservice.model.entity.*;
import com.example.usermanagementservice.model.entity.staff.*;
import com.example.usermanagementservice.model.enums.Gender;
import com.example.usermanagementservice.model.enums.Position;
import com.example.usermanagementservice.model.enums.Role;
import com.example.usermanagementservice.model.enums.StaffRole;
import com.example.usermanagementservice.model.enums.StatusOfPlayer;
import com.example.usermanagementservice.model.entity.NationalTeam;
import com.example.usermanagementservice.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
@Order(20)
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
public class UserDataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PlayerRepository playerRepository;
    private final HeadCoachRepository headCoachRepository;
    private final DoctorRepository doctorRepository;
    private final PhysiotherapistRepository physiotherapistRepository;
    private final FitnessCoachRepository fitnessCoachRepository;
    private final TeamManagerRepository teamManagerRepository;
    private final SportManagerRepository sportManagerRepository;
    private final ScoutRepository scoutRepository;
    private final SponsorRepository sponsorRepository;
    private final FanRepository fanRepository;
    private final NationalTeamRepository nationalTeamRepository;
    private final AssistantCoachRepository assistantCoachRepository;
    private final PerformanceAnalystRepository performanceAnalystRepository;
    private final SpecificCoachRepository specificCoachRepository;

    @Override
    @Transactional
    public void run(String... args) {
        long existing = userRepository.count();
        if (existing > 1) {
            log.info("[SEED] user-management already has {} users — skipping demo seed.", existing);
            return;
        }
        log.info("[SEED] Seeding demo users into user-management-service...");

        // SEED CONTRACT — these references stay in sync with player-mgmt seed order:
        //   Sports:    1=Football, 2=Basketball, 3=Tennis, 4=Volleyball, 5=Swimming, 6=Handball
        //   Teams:     1=FC Barcelona (FB), 2=FC Barcelona Bàsquet (BB), 3=Barça Tennis, 4=CV Barcelona
        //   Rosters:   one per player in player-mgmt insert order → 1..6 line up with player1..player6
        //   Contracts: same — 1..6 line up with player1..player6
        SportManager sportManager = saveSportManager();
        TeamManager teamManager = saveTeamManager(sportManager);

        saveHeadCoach(SeedIds.HEAD_COACH_FB, "headcoach", "Hansi", "Flick",
                "headcoach@mscms.com", "+34600000020", 59, Gender.MALE, "Barcelona",
                1L, 1L, teamManager, 25, "UEFA Pro");
        saveHeadCoach(SeedIds.HEAD_COACH_BB, "headcoach2", "Joan", "Peñarroya",
                "headcoach2@mscms.com", "+34600000021", 60, Gender.MALE, "Barcelona",
                2L, 2L, teamManager, 22, "FIBA Level 3");

        saveDoctor(teamManager);
        savePhysio(teamManager);
        saveFitnessCoach(teamManager);

        saveScout();
        saveSponsor();
        saveFan();

        // Real Wikipedia/Wikimedia Commons photo URLs (stable). The frontend
        // PlayerCard falls back to initials if a URL is null or fails to load.
        final String PH_LEWANDOWSKI = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/2019147183134_2019-05-27_Fussball_1.FC_Kaiserslautern_vs_FC_Bayern_M%C3%BCnchen_-_Sven_-_1D_X_MK_II_-_0228_-_B70I8527_%28cropped%29.jpg/500px-2019147183134_2019-05-27_Fussball_1.FC_Kaiserslautern_vs_FC_Bayern_M%C3%BCnchen_-_Sven_-_1D_X_MK_II_-_0228_-_B70I8527_%28cropped%29.jpg";
        final String PH_PEDRI       = "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Pedri.jpg/500px-Pedri.jpg";
        final String PH_ARAUJO      = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/FC_Red_Bull_Salzburg_gegen_CF_Barcelona_%28Testspiel_4._August_2021%29_45_%28cropped%29.jpg/500px-FC_Red_Bull_Salzburg_gegen_CF_Barcelona_%28Testspiel_4._August_2021%29_45_%28cropped%29.jpg";
        final String PH_TERSTEGEN   = "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Marc-Andre_Ter_Stegen_ACCI_FCBARCELONA_Turisme_Catalunya_gira_pretemporada_CATPRESS.jpg/500px-Marc-Andre_Ter_Stegen_ACCI_FCBARCELONA_Turisme_Catalunya_gira_pretemporada_CATPRESS.jpg";
        final String PH_SATORANSKY  = "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/2025-03-07_ALBA_Berlin_gegen_FC_Barcelona_B%C3%A0squet_%28EuroLeague_2024-25%29_by_Sandro_Halank%E2%80%93075.jpg/500px-2025-03-07_ALBA_Berlin_gegen_FC_Barcelona_B%C3%A0squet_%28EuroLeague_2024-25%29_by_Sandro_Halank%E2%80%93075.jpg";
        final String PH_CARLA       = "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Suarez_Navarro_WM19_%2811%29_%2848521709586%29.jpg/500px-Suarez_Navarro_WM19_%2811%29_%2848521709586%29.jpg";
        final String PH_DIKAMEM     = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Dika_Mem_Championship_2018.jpg/500px-Dika_Mem_Championship_2018.jpg";
        final String PH_PENA        = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Bar%C3%A7a_Napoli_03.jpg/500px-Bar%C3%A7a_Napoli_03.jpg";
        final String PH_CHRISTENSEN = "https://upload.wikimedia.org/wikipedia/commons/6/6d/Andreas_Christensen_2019.jpg";
        final String PH_CUBARSI     = "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Pau_Cubars%C3%AD_%28cropped%29.jpg/500px-Pau_Cubars%C3%AD_%28cropped%29.jpg";
        final String PH_KOUNDE      = "https://upload.wikimedia.org/wikipedia/commons/b/bd/Jules_Kound%C3%A9_2020.jpg";
        final String PH_BALDE       = "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Esapana-inglaterra-74_%2848899354493%29.jpg/500px-Esapana-inglaterra-74_%2848899354493%29.jpg";
        final String PH_SERGI       = "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Sergi_Roberto_2019_03_17_1.jpg/500px-Sergi_Roberto_2019_03_17_1.jpg";
        final String PH_DEJONG      = "https://upload.wikimedia.org/wikipedia/commons/4/42/%D0%9C%D0%B0%D1%82%D1%87_%C2%AB%D0%94%D0%B8%D0%BD%D0%B0%D0%BC%D0%BE%C2%BB_-_%C2%AB%D0%91%D0%B0%D1%80%D1%81%D0%B5%D0%BB%D0%BE%D0%BD%D0%B0%C2%BB_0-1._2_%D0%BD%D0%BE%D1%8F%D0%B1%D1%80%D1%8F_2021_%D0%B3%D0%BE%D0%B4%D0%B0._II_%E2%80%94_1289671_%28cropped%29.jpg";
        final String PH_GAVI        = "https://upload.wikimedia.org/wikipedia/commons/1/1e/Jugadors_pretemporada_pels_Estats_Units_%28cropped%292.jpg";
        final String PH_GUNDOGAN    = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/20180602_FIFA_Friendly_Match_Austria_vs._Germany_%C4%B0lkay_G%C3%BCndo%C4%9Fan_850_0728.jpg/500px-20180602_FIFA_Friendly_Match_Austria_vs._Germany_%C4%B0lkay_G%C3%BCndo%C4%9Fan_850_0728.jpg";
        final String PH_ROMEU       = "https://upload.wikimedia.org/wikipedia/commons/d/d2/Oriol_romeu.jpg";
        final String PH_FERMIN      = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Ferm%C3%ADn_L%C3%B3pez_%28cropped%29.jpg/500px-Ferm%C3%ADn_L%C3%B3pez_%28cropped%29.jpg";
        final String PH_YAMAL       = "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Lamine_Yamal_in_2025.jpg/500px-Lamine_Yamal_in_2025.jpg";
        final String PH_RAPHINHA    = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Raphael_Dias_Belloli_2023.jpg/500px-Raphael_Dias_Belloli_2023.jpg";
        final String PH_FERRAN      = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Ferran_Torres_Garc%C3%ADa.png/500px-Ferran_Torres_Garc%C3%ADa.png";
        final String PH_ANSU        = "https://upload.wikimedia.org/wikipedia/commons/e/ef/%D0%9C%D0%B0%D1%82%D1%87_%C2%AB%D0%94%D0%B8%D0%BD%D0%B0%D0%BC%D0%BE%C2%BB_-_%C2%AB%D0%91%D0%B0%D1%80%D1%81%D0%B5%D0%BB%D0%BE%D0%BD%D0%B0%C2%BB_0-1._2_%D0%BB%D0%B8%D1%81%D1%82%D0%BE%D0%BF%D0%B0%D0%B4%D0%B0_2021_%D1%80%D0%BE%D0%BA%D1%83_%E2%80%94_1289339_%28cropped%29.jpg";
        final String PH_VITORROQUE  = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Vitor-roque-palmeiras-internacional-sep2025.jpg/500px-Vitor-roque-palmeiras-internacional-sep2025.jpg";

        // ─── FC Barcelona football squad — first 4 have Keycloak logins ──────
        // Names match sportify-main/Evaluate Players/Football_Players_Data.csv
        // so the ML Player Rating service can find them by exact name.
        savePlayer(SeedIds.PLAYER_1_STRIKER, "player1", "Robert", "Lewandowski", "player1@mscms.com",
                "+34600000101", 36, Gender.MALE, "Barcelona",
                LocalDate.of(1988, 8, 21), "Polish", Position.STRIKER, 15_000_000L, 9, 1L, 1L, PH_LEWANDOWSKI, StatusOfPlayer.AVAILABLE);
        savePlayer(SeedIds.PLAYER_2_MID, "player2", "Pedri", "González López", "player2@mscms.com",
                "+34600000102", 21, Gender.MALE, "Barcelona",
                LocalDate.of(2002, 11, 25), "Spanish", Position.ATTACKING_MID, 100_000_000L, 8, 2L, 2L, PH_PEDRI, StatusOfPlayer.AVAILABLE);
        savePlayer(SeedIds.PLAYER_3_DEF, "player3", "Ronald", "Araújo", "player3@mscms.com",
                "+34600000103", 25, Gender.MALE, "Barcelona",
                LocalDate.of(1999, 3, 7), "Uruguayan", Position.CENTER_BACK, 70_000_000L, 4, 3L, 3L, PH_ARAUJO, StatusOfPlayer.AVAILABLE);
        savePlayer(SeedIds.PLAYER_4_GK, "player4", "Marc-André", "ter Stegen", "player4@mscms.com",
                "+34600000104", 32, Gender.MALE, "Barcelona",
                LocalDate.of(1992, 4, 30), "German", Position.GOALKEEPER, 30_000_000L, 1, 4L, 4L, PH_TERSTEGEN, StatusOfPlayer.AVAILABLE);

        // Basketball → team 2 (FC Barcelona Bàsquet) / sport 2
        savePlayer(SeedIds.PLAYER_5_BBALL, "player5", "Tomáš", "Satoranský", "player5@mscms.com",
                "+34600000105", 33, Gender.MALE, "Barcelona",
                LocalDate.of(1991, 10, 30), "Czech", Position.POINT_GUARD, 4_500_000L, 7, 5L, 5L, PH_SATORANSKY, StatusOfPlayer.AVAILABLE);

        // Tennis → team 3 (Barça Tennis Academy) / sport 3
        savePlayer(SeedIds.PLAYER_6_TENNIS, "player6", "Carla", "Suárez Navarro", "player6@mscms.com",
                "+34600000106", 36, Gender.FEMALE, "Barcelona",
                LocalDate.of(1988, 9, 3), "Spanish", Position.SINGLES_PLAYER, 2_500_000L, null, 6L, 6L, PH_CARLA, StatusOfPlayer.AVAILABLE);

        // Handball → team 5 (FC Barcelona Handbol) / sport 6
        savePlayer(SeedIds.PLAYER_7_HB_BACK, "player7", "Aleix", "Gómez", "player7@mscms.com",
                "+34600000107", 27, Gender.MALE, "Barcelona",
                LocalDate.of(1997, 6, 23), "Spanish", Position.HB_LEFT_BACK, 1_200_000L, 23, 7L, 7L, null, StatusOfPlayer.AVAILABLE);
        savePlayer(SeedIds.PLAYER_8_HB_CB, "player8", "Ludovic", "Fabregas", "player8@mscms.com",
                "+34600000108", 28, Gender.MALE, "Barcelona",
                LocalDate.of(1996, 7, 11), "French", Position.HB_CENTRE_BACK, 1_500_000L, 15, 8L, 8L, null, StatusOfPlayer.AVAILABLE);
        savePlayer(SeedIds.PLAYER_9_HB_WING, "player9", "Domen", "Makuc", "player9@mscms.com",
                "+34600000109", 25, Gender.MALE, "Barcelona",
                LocalDate.of(2000, 5, 28), "Slovenian", Position.HB_LEFT_WING, 900_000L, 7, 9L, 9L, null, StatusOfPlayer.AVAILABLE);
        savePlayer(SeedIds.PLAYER_10_HB_PIVOT, "player10", "Dika", "Mem", "player10@mscms.com",
                "+34600000110", 27, Gender.MALE, "Barcelona",
                LocalDate.of(1997, 12, 5), "French", Position.HB_PIVOT, 1_100_000L, 9, 10L, 10L, PH_DIKAMEM, StatusOfPlayer.AVAILABLE);

        // ─── National Teams (foreign federations Barça players can be called up to) ─
        saveNationalTeam("00000000-0000-0000-0000-000000000200", "national_spain",
                "Spain", "Spain National Team", "Real Federación Española de Fútbol",
                "Luis de la Fuente", "info@rfef.es");
        saveNationalTeam("00000000-0000-0000-0000-000000000201", "national_uruguay",
                "Uruguay", "Uruguay National Team", "Asociación Uruguaya de Fútbol",
                "Marcelo Bielsa", "info@auf.org.uy");

        // ─── Extended FC Barcelona football squad (no login accounts) ────────
        // Appended AFTER the national teams so existing numeric ids stay stable.
        // These complete the 20-man squad from the ML dataset. Numeric ids 24..39.
        savePlayer(SeedIds.PLAYER_11_GK, "inaki.pena", "Iñaki", "Peña", "inaki.pena@fcbarcelona.com",
                "+34600000111", 25, Gender.MALE, "Barcelona",
                LocalDate.of(1999, 3, 2), "Spanish", Position.GOALKEEPER, 8_000_000L, 13, 11L, 11L, PH_PENA, StatusOfPlayer.AVAILABLE);
        savePlayer(SeedIds.PLAYER_12_CB, "andreas.christensen", "Andreas", "Christensen", "andreas.christensen@fcbarcelona.com",
                "+34600000112", 28, Gender.MALE, "Barcelona",
                LocalDate.of(1996, 4, 10), "Danish", Position.CENTER_BACK, 15_000_000L, 15, 12L, 12L, PH_CHRISTENSEN, StatusOfPlayer.AVAILABLE);
        savePlayer(SeedIds.PLAYER_13_CB, "pau.cubarsi", "Pau", "Cubarsí", "pau.cubarsi@fcbarcelona.com",
                "+34600000113", 17, Gender.MALE, "Barcelona",
                LocalDate.of(2007, 1, 22), "Spanish", Position.CENTER_BACK, 60_000_000L, 2, 13L, 13L, PH_CUBARSI, StatusOfPlayer.INJURED);
        savePlayer(SeedIds.PLAYER_14_RB, "jules.kounde", "Jules", "Koundé", "jules.kounde@fcbarcelona.com",
                "+34600000114", 25, Gender.MALE, "Barcelona",
                LocalDate.of(1998, 11, 12), "French", Position.RIGHT_BACK, 60_000_000L, 23, 14L, 14L, PH_KOUNDE, StatusOfPlayer.AVAILABLE);
        savePlayer(SeedIds.PLAYER_15_LB, "alex.balde", "Alejandro", "Balde", "alex.balde@fcbarcelona.com",
                "+34600000115", 20, Gender.MALE, "Barcelona",
                LocalDate.of(2003, 10, 18), "Spanish", Position.LEFT_BACK, 50_000_000L, 3, 15L, 15L, PH_BALDE, StatusOfPlayer.AVAILABLE);
        savePlayer(SeedIds.PLAYER_16_RB, "sergi.roberto", "Sergi", "Roberto", "sergi.roberto@fcbarcelona.com",
                "+34600000116", 32, Gender.MALE, "Barcelona",
                LocalDate.of(1992, 2, 7), "Spanish", Position.RIGHT_BACK, 4_000_000L, 20, 16L, 16L, PH_SERGI, StatusOfPlayer.AVAILABLE);
        savePlayer(SeedIds.PLAYER_17_CM, "frenkie.dejong", "Frenkie", "de Jong", "frenkie.dejong@fcbarcelona.com",
                "+34600000117", 26, Gender.MALE, "Barcelona",
                LocalDate.of(1997, 5, 12), "Dutch", Position.CENTRAL_MID, 70_000_000L, 21, 17L, 17L, PH_DEJONG, StatusOfPlayer.AVAILABLE);
        savePlayer(SeedIds.PLAYER_18_CM, "gavi", "Pablo", "Gavi", "gavi@fcbarcelona.com",
                "+34600000118", 20, Gender.MALE, "Barcelona",
                LocalDate.of(2004, 8, 5), "Spanish", Position.CENTRAL_MID, 90_000_000L, 6, 18L, 18L, PH_GAVI, StatusOfPlayer.AVAILABLE);
        savePlayer(SeedIds.PLAYER_19_CM, "ilkay.gundogan", "İlkay", "Gündoğan", "ilkay.gundogan@fcbarcelona.com",
                "+34600000119", 33, Gender.MALE, "Barcelona",
                LocalDate.of(1990, 10, 24), "German", Position.CENTRAL_MID, 15_000_000L, 22, 19L, 19L, PH_GUNDOGAN, StatusOfPlayer.INJURED);
        savePlayer(SeedIds.PLAYER_20_CDM, "oriol.romeu", "Oriol", "Romeu", "oriol.romeu@fcbarcelona.com",
                "+34600000120", 32, Gender.MALE, "Barcelona",
                LocalDate.of(1991, 9, 24), "Spanish", Position.DEFENSIVE_MID, 5_000_000L, 18, 20L, 20L, PH_ROMEU, StatusOfPlayer.AVAILABLE);
        savePlayer(SeedIds.PLAYER_21_CM, "fermin.lopez", "Fermín", "López", "fermin.lopez@fcbarcelona.com",
                "+34600000121", 21, Gender.MALE, "Barcelona",
                LocalDate.of(2003, 5, 11), "Spanish", Position.CENTRAL_MID, 30_000_000L, 16, 21L, 21L, PH_FERMIN, StatusOfPlayer.AVAILABLE);
        savePlayer(SeedIds.PLAYER_22_RW, "lamine.yamal", "Lamine", "Yamal", "lamine.yamal@fcbarcelona.com",
                "+34600000122", 17, Gender.MALE, "Barcelona",
                LocalDate.of(2007, 7, 13), "Spanish", Position.RIGHT_WING, 180_000_000L, 19, 22L, 22L, PH_YAMAL, StatusOfPlayer.AVAILABLE);
        savePlayer(SeedIds.PLAYER_23_RW, "raphinha", "Raphinha", "Dias Belloli", "raphinha@fcbarcelona.com",
                "+34600000123", 27, Gender.MALE, "Barcelona",
                LocalDate.of(1996, 12, 14), "Brazilian", Position.RIGHT_WING, 60_000_000L, 11, 23L, 23L, PH_RAPHINHA, StatusOfPlayer.AVAILABLE);
        savePlayer(SeedIds.PLAYER_24_LW, "ferran.torres", "Ferran", "Torres", "ferran.torres@fcbarcelona.com",
                "+34600000124", 24, Gender.MALE, "Barcelona",
                LocalDate.of(2000, 2, 29), "Spanish", Position.LEFT_WING, 30_000_000L, 7, 24L, 24L, PH_FERRAN, StatusOfPlayer.AVAILABLE);
        savePlayer(SeedIds.PLAYER_25_LW, "ansu.fati", "Ansu", "Fati", "ansu.fati@fcbarcelona.com",
                "+34600000125", 21, Gender.MALE, "Barcelona",
                LocalDate.of(2002, 10, 31), "Spanish", Position.LEFT_WING, 20_000_000L, 10, 25L, 25L, PH_ANSU, StatusOfPlayer.AVAILABLE);
        savePlayer(SeedIds.PLAYER_26_ST, "vitor.roque", "Vitor", "Roque", "vitor.roque@fcbarcelona.com",
                "+34600000126", 19, Gender.MALE, "Barcelona",
                LocalDate.of(2005, 2, 28), "Brazilian", Position.STRIKER, 30_000_000L, 14, 26L, 26L, PH_VITORROQUE, StatusOfPlayer.AVAILABLE);

        // ─── Extra staff — fill the previously-empty staff tables ────────────
        saveAssistantCoach(teamManager);
        savePerformanceAnalyst(teamManager);
        saveSpecificCoach(teamManager);
        saveAdmin2();

        // ─── Full FC Barcelona Bàsquet squad (basketball, team 2) ────────────
        final String PH_VESELY      = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Jan_Vesel%C3%BD_6_FC_Barcelona_%28basketball%29_Euroleague_20251120_%282%29_%28cropped%29.jpg/500px-Jan_Vesel%C3%BD_6_FC_Barcelona_%28basketball%29_Euroleague_20251120_%282%29_%28cropped%29.jpg";
        final String PH_HERNANGOMEZ = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/2025-03-07_ALBA_Berlin_gegen_FC_Barcelona_B%C3%A0squet_%28EuroLeague_2024-25%29_by_Sandro_Halank%E2%80%93054.jpg/500px-2025-03-07_ALBA_Berlin_gegen_FC_Barcelona_B%C3%A0squet_%28EuroLeague_2024-25%29_by_Sandro_Halank%E2%80%93054.jpg";
        final String PH_SHENGELIA   = "https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Tornike_Shengelia_23_FC_Barcelona_%28basketball%29_Euroleague_20251120_%285%29_%28cropped%29.jpg/500px-Tornike_Shengelia_23_FC_Barcelona_%28basketball%29_Euroleague_20251120_%285%29_%28cropped%29.jpg";
        final String PH_PARKER      = "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/2025-03-07_ALBA_Berlin_gegen_FC_Barcelona_B%C3%A0squet_%28EuroLeague_2024-25%29_by_Sandro_Halank%E2%80%93108.jpg/500px-2025-03-07_ALBA_Berlin_gegen_FC_Barcelona_B%C3%A0squet_%28EuroLeague_2024-25%29_by_Sandro_Halank%E2%80%93108.jpg";
        final String PH_ABRINES     = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/2025-03-07_ALBA_Berlin_gegen_FC_Barcelona_B%C3%A0squet_%28EuroLeague_2024-25%29_by_Sandro_Halank%E2%80%93020.jpg/500px-2025-03-07_ALBA_Berlin_gegen_FC_Barcelona_B%C3%A0squet_%28EuroLeague_2024-25%29_by_Sandro_Halank%E2%80%93020.jpg";
        final String PH_BRIZUELA    = "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/2025-03-07_ALBA_Berlin_gegen_FC_Barcelona_B%C3%A0squet_%28EuroLeague_2024-25%29_by_Sandro_Halank%E2%80%93167.jpg/500px-2025-03-07_ALBA_Berlin_gegen_FC_Barcelona_B%C3%A0squet_%28EuroLeague_2024-25%29_by_Sandro_Halank%E2%80%93167.jpg";
        final String PH_PUNTER      = "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Kevin_Punter_0_FC_Barcelona_%28basketball%29_Euroleague_20250402_%284%29.jpg/500px-Kevin_Punter_0_FC_Barcelona_%28basketball%29_Euroleague_20250402_%284%29.jpg";
        final String PH_JOKUBAITIS  = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/2022-03-22_ALBA_Berlin_gegen_FC_Barcelona_B%C3%A0squet_%28EuroLeague_2021-22%29_by_Sandro_Halank%E2%80%93028.jpg/500px-2022-03-22_ALBA_Berlin_gegen_FC_Barcelona_B%C3%A0squet_%28EuroLeague_2021-22%29_by_Sandro_Halank%E2%80%93028.jpg";
        final String PH_PDV         = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Gonzalo_Perez_De_Vargas_3_20161112.jpg/500px-Gonzalo_Perez_De_Vargas_3_20161112.jpg";
        final String PH_NIELSEN     = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Emil_Nielsen_-1.jpg/500px-Emil_Nielsen_-1.jpg";
        final String PH_CINDRIC     = "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Luka_Cindric_2014.jpg/500px-Luka_Cindric_2014.jpg";
        final String PH_NGUESSAN    = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Timothey_N%27guessan_20161112.jpg/500px-Timothey_N%27guessan_20161112.jpg";
        final String PH_JANC        = "https://upload.wikimedia.org/wikipedia/commons/7/76/EHF_EURO_2018_%28rakomet%29_Makedonija-Slovenija_13.01.2018-0647_%2839641853922%29_%28cropped%29.jpg";

        savePlayer(SeedIds.BB_VESELY, "jan.vesely", "Jan", "Veselý", "jan.vesely@fcbarcelona.com",
                "+34600000211", 34, Gender.MALE, "Barcelona", LocalDate.of(1990, 4, 24), "Czech", Position.CENTER, 3_000_000L, 24, 27L, 27L, PH_VESELY, StatusOfPlayer.AVAILABLE);
        savePlayer(SeedIds.BB_HERNANGOMEZ, "willy.hernangomez", "Willy", "Hernangómez", "willy.hernangomez@fcbarcelona.com",
                "+34600000212", 30, Gender.MALE, "Barcelona", LocalDate.of(1994, 5, 27), "Spanish", Position.CENTER, 4_000_000L, 14, 28L, 28L, PH_HERNANGOMEZ, StatusOfPlayer.AVAILABLE);
        savePlayer(SeedIds.BB_SHENGELIA, "tornike.shengelia", "Tornike", "Shengelia", "tornike.shengelia@fcbarcelona.com",
                "+34600000213", 33, Gender.MALE, "Barcelona", LocalDate.of(1991, 10, 5), "Georgian", Position.POWER_FORWARD, 3_500_000L, 23, 29L, 29L, PH_SHENGELIA, StatusOfPlayer.AVAILABLE);
        savePlayer(SeedIds.BB_PARKER, "jabari.parker", "Jabari", "Parker", "jabari.parker@fcbarcelona.com",
                "+34600000214", 29, Gender.MALE, "Barcelona", LocalDate.of(1995, 3, 15), "American", Position.SMALL_FORWARD, 3_000_000L, 20, 30L, 30L, PH_PARKER, StatusOfPlayer.AVAILABLE);
        savePlayer(SeedIds.BB_ABRINES, "alex.abrines", "Álex", "Abrines", "alex.abrines@fcbarcelona.com",
                "+34600000215", 31, Gender.MALE, "Barcelona", LocalDate.of(1993, 8, 1), "Spanish", Position.SHOOTING_GUARD, 2_000_000L, 21, 31L, 31L, PH_ABRINES, StatusOfPlayer.AVAILABLE);
        savePlayer(SeedIds.BB_BRIZUELA, "dario.brizuela", "Darío", "Brizuela", "dario.brizuela@fcbarcelona.com",
                "+34600000216", 30, Gender.MALE, "Barcelona", LocalDate.of(1994, 11, 8), "Spanish", Position.SHOOTING_GUARD, 2_500_000L, 11, 32L, 32L, PH_BRIZUELA, StatusOfPlayer.AVAILABLE);
        savePlayer(SeedIds.BB_PUNTER, "kevin.punter", "Kevin", "Punter", "kevin.punter@fcbarcelona.com",
                "+34600000217", 31, Gender.MALE, "Barcelona", LocalDate.of(1993, 6, 25), "American", Position.SHOOTING_GUARD, 3_000_000L, 5, 33L, 33L, PH_PUNTER, StatusOfPlayer.AVAILABLE);
        savePlayer(SeedIds.BB_LAPROVITTOLA, "nico.laprovittola", "Nicolás", "Laprovittola", "nico.laprovittola@fcbarcelona.com",
                "+34600000218", 34, Gender.MALE, "Barcelona", LocalDate.of(1990, 1, 31), "Argentine", Position.POINT_GUARD, 2_500_000L, 18, 34L, 34L, null, StatusOfPlayer.AVAILABLE);
        savePlayer(SeedIds.BB_JOKUBAITIS, "rokas.jokubaitis", "Rokas", "Jokubaitis", "rokas.jokubaitis@fcbarcelona.com",
                "+34600000219", 24, Gender.MALE, "Barcelona", LocalDate.of(2000, 11, 22), "Lithuanian", Position.POINT_GUARD, 5_000_000L, 15, 35L, 35L, PH_JOKUBAITIS, StatusOfPlayer.AVAILABLE);

        // ─── Full FC Barcelona Handbol squad (handball, team 5) ──────────────
        savePlayer(SeedIds.HB_PDV, "gonzalo.pdv", "Gonzalo", "Pérez de Vargas", "gonzalo.pdv@fcbarcelona.com",
                "+34600000231", 33, Gender.MALE, "Barcelona", LocalDate.of(1991, 1, 15), "Spanish", Position.HB_GOALKEEPER, 1_200_000L, 1, 36L, 36L, PH_PDV, StatusOfPlayer.AVAILABLE);
        savePlayer(SeedIds.HB_NIELSEN, "emil.nielsen", "Emil", "Nielsen", "emil.nielsen@fcbarcelona.com",
                "+34600000232", 27, Gender.MALE, "Barcelona", LocalDate.of(1997, 6, 19), "Danish", Position.HB_GOALKEEPER, 1_500_000L, 16, 37L, 37L, PH_NIELSEN, StatusOfPlayer.AVAILABLE);
        savePlayer(SeedIds.HB_RICHARDSON, "melvyn.richardson", "Melvyn", "Richardson", "melvyn.richardson@fcbarcelona.com",
                "+34600000233", 27, Gender.MALE, "Barcelona", LocalDate.of(1997, 12, 29), "French", Position.HB_LEFT_BACK, 1_400_000L, 23, 38L, 38L, null, StatusOfPlayer.AVAILABLE);
        savePlayer(SeedIds.HB_CINDRIC, "luka.cindric", "Luka", "Cindrić", "luka.cindric@fcbarcelona.com",
                "+34600000234", 31, Gender.MALE, "Barcelona", LocalDate.of(1993, 4, 13), "Croatian", Position.HB_CENTRE_BACK, 1_300_000L, 20, 39L, 39L, PH_CINDRIC, StatusOfPlayer.AVAILABLE);
        savePlayer(SeedIds.HB_NGUESSAN, "timothey.nguessan", "Timothey", "N'Guessan", "timothey.nguessan@fcbarcelona.com",
                "+34600000235", 32, Gender.MALE, "Barcelona", LocalDate.of(1992, 5, 21), "French", Position.HB_RIGHT_BACK, 1_100_000L, 25, 40L, 40L, PH_NGUESSAN, StatusOfPlayer.AVAILABLE);
        savePlayer(SeedIds.HB_JANC, "blaz.janc", "Blaž", "Janc", "blaz.janc@fcbarcelona.com",
                "+34600000236", 28, Gender.MALE, "Barcelona", LocalDate.of(1996, 2, 6), "Slovenian", Position.HB_RIGHT_WING, 1_300_000L, 18, 41L, 41L, PH_JANC, StatusOfPlayer.AVAILABLE);
        savePlayer(SeedIds.HB_URDANGARIN, "pablo.urdangarin", "Pablo", "Urdangarin", "pablo.urdangarin@fcbarcelona.com",
                "+34600000237", 24, Gender.MALE, "Barcelona", LocalDate.of(2000, 12, 6), "Spanish", Position.HB_RIGHT_WING, 600_000L, 92, 42L, 42L, null, StatusOfPlayer.AVAILABLE);

        // ─── Tennis squad (Barça Tennis Academy, team 3) ─────────────────────
        final String PH_ALCARAZ  = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/25th_Laureus_World_Sports_Awards_-_Red_Carpet_-_Carlos_Alcaraz_-_240422_192324_%28cropped%29.jpg/500px-25th_Laureus_World_Sports_Awards_-_Red_Carpet_-_Carlos_Alcaraz_-_240422_192324_%28cropped%29.jpg";
        final String PH_NADAL    = "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Rafael_Nadal_en_2024_%28cropped%29.jpg/500px-Rafael_Nadal_en_2024_%28cropped%29.jpg";
        final String PH_BADOSA   = "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Badosa_RG21_%2814%29_%2851376409698%29_%28cropped%29.jpg/500px-Badosa_RG21_%2814%29_%2851376409698%29_%28cropped%29.jpg";
        final String PH_MUGURUZA = "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/25th_Laureus_World_Sports_Awards_-_Red_Carpet_-_Garbi%C3%B1e_Muguruza_-_240422_182821-2_%28cropped%29.jpg/500px-25th_Laureus_World_Sports_Awards_-_Red_Carpet_-_Garbi%C3%B1e_Muguruza_-_240422_182821-2_%28cropped%29.jpg";
        final String PH_CARRENO  = "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Carreno_Busta_MCM22_%287%29_%2852035375722%29.jpg/500px-Carreno_Busta_MCM22_%287%29_%2852035375722%29.jpg";
        final String PH_BAUTISTA = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Bautista_Agut_MCM23_%2814%29_%2852883313449%29.jpg/500px-Bautista_Agut_MCM23_%2814%29_%2852883313449%29.jpg";

        savePlayer(SeedIds.TN_ALCARAZ, "carlos.alcaraz", "Carlos", "Alcaraz", "carlos.alcaraz@fcbarcelona.com",
                "+34600000241", 23, Gender.MALE, "Barcelona", LocalDate.of(2003, 5, 5), "Spanish", Position.SINGLES_PLAYER, 30_000_000L, null, 43L, 43L, PH_ALCARAZ, StatusOfPlayer.AVAILABLE);
        savePlayer(SeedIds.TN_NADAL, "rafael.nadal", "Rafael", "Nadal", "rafael.nadal@fcbarcelona.com",
                "+34600000242", 40, Gender.MALE, "Barcelona", LocalDate.of(1986, 6, 3), "Spanish", Position.SINGLES_PLAYER, 5_000_000L, null, 44L, 44L, PH_NADAL, StatusOfPlayer.AVAILABLE);
        savePlayer(SeedIds.TN_BADOSA, "paula.badosa", "Paula", "Badosa", "paula.badosa@fcbarcelona.com",
                "+34600000243", 28, Gender.FEMALE, "Barcelona", LocalDate.of(1997, 11, 15), "Spanish", Position.SINGLES_PLAYER, 6_000_000L, null, 45L, 45L, PH_BADOSA, StatusOfPlayer.AVAILABLE);
        savePlayer(SeedIds.TN_MUGURUZA, "garbine.muguruza", "Garbiñe", "Muguruza", "garbine.muguruza@fcbarcelona.com",
                "+34600000244", 32, Gender.FEMALE, "Barcelona", LocalDate.of(1993, 10, 8), "Spanish", Position.SINGLES_PLAYER, 4_000_000L, null, 46L, 46L, PH_MUGURUZA, StatusOfPlayer.AVAILABLE);
        savePlayer(SeedIds.TN_CARRENO, "pablo.carreno", "Pablo", "Carreño Busta", "pablo.carreno@fcbarcelona.com",
                "+34600000245", 34, Gender.MALE, "Barcelona", LocalDate.of(1991, 7, 12), "Spanish", Position.DOUBLES_PLAYER, 3_000_000L, null, 47L, 47L, PH_CARRENO, StatusOfPlayer.AVAILABLE);
        savePlayer(SeedIds.TN_BAUTISTA, "roberto.bautista", "Roberto", "Bautista Agut", "roberto.bautista@fcbarcelona.com",
                "+34600000246", 38, Gender.MALE, "Barcelona", LocalDate.of(1988, 4, 14), "Spanish", Position.SINGLES_PLAYER, 3_500_000L, null, 48L, 48L, PH_BAUTISTA, StatusOfPlayer.AVAILABLE);

        log.info("[SEED] user-management seeded: total users = {}", userRepository.count());
    }

    // ─── helpers ────────────────────────────────────────────────────────────

    private SportManager saveSportManager() {
        SportManager sm = new SportManager();
        applyCommon(sm, SeedIds.SPORT_MANAGER, "sportmanager", "Joan", "Laporta",
                "sportmanager@mscms.com", "+34600000010", 62, Gender.MALE, "Barcelona", Role.SPORT_MANGER);
        sm.setSportId(1L);
        sm.setCanManageAllTeams(true);
        return sportManagerRepository.save(sm);
    }

    private TeamManager saveTeamManager(SportManager sportManager) {
        TeamManager tm = new TeamManager();
        applyCommon(tm, SeedIds.TEAM_MANAGER, "teammanager", "Deco", "Souza",
                "teammanager@mscms.com", "+34600000011", 47, Gender.MALE, "Barcelona", Role.TEAM_MANGER);
        tm.setTeamId(1L);
        tm.setCanManageAllStaffMembers(true);
        tm.setSportManager(sportManager);
        return teamManagerRepository.save(tm);
    }

    private HeadCoach saveHeadCoach(String keycloakId, String username, String first, String last,
                                    String email, String phone, int age, Gender gender, String address,
                                    Long sportId, Long teamId, TeamManager tm,
                                    int yearsExp, String licenseLevel) {
        HeadCoach hc = new HeadCoach();
        applyCommon(hc, keycloakId, username, first, last, email, phone, age, gender, address, Role.STAFF);
        hc.setSportId(sportId);
        hc.setTeamId(teamId);
        hc.setStaffrole(StaffRole.HEAD_COACH);
        hc.setTeamManager(tm);
        hc.setYearsOfExperience(yearsExp);
        hc.setCoachingLicenseLevel(licenseLevel);
        hc.setPreManagedTeams(List.of("Bayern Munich", "Germany National Team"));
        return headCoachRepository.save(hc);
    }

    private Doctor saveDoctor(TeamManager tm) {
        Doctor d = new Doctor();
        applyCommon(d, SeedIds.DOCTOR, "doctor", "Ricard", "Pruna",
                "doctor@mscms.com", "+34600000030", 56, Gender.MALE, "Barcelona", Role.STAFF);
        d.setSportId(1L);
        d.setTeamId(1L);
        d.setStaffrole(StaffRole.TEAM_DOCTOR);
        d.setTeamManager(tm);
        d.setSpecialization("Sports Medicine");
        return doctorRepository.save(d);
    }

    private Physiotherapist savePhysio(TeamManager tm) {
        Physiotherapist p = new Physiotherapist();
        applyCommon(p, SeedIds.PHYSIO, "physio", "Juanjo", "Brau",
                "physio@mscms.com", "+34600000031", 48, Gender.MALE, "Barcelona", Role.STAFF);
        p.setSportId(1L);
        p.setTeamId(1L);
        p.setStaffrole(StaffRole.PHYSIOTHERAPIST);
        p.setTeamManager(tm);
        p.setYearsExperience(15);
        return physiotherapistRepository.save(p);
    }

    private FitnessCoach saveFitnessCoach(TeamManager tm) {
        FitnessCoach fc = new FitnessCoach();
        applyCommon(fc, SeedIds.FITNESS_COACH, "fitness", "Albert", "Roca",
                "fitness@mscms.com", "+34600000032", 50, Gender.MALE, "Barcelona", Role.STAFF);
        fc.setSportId(1L);
        fc.setTeamId(1L);
        fc.setStaffrole(StaffRole.FITNESS_COACH);
        fc.setTeamManager(tm);
        return fitnessCoachRepository.save(fc);
    }

    private AssistantCoach saveAssistantCoach(TeamManager tm) {
        AssistantCoach ac = new AssistantCoach();
        applyCommon(ac, SeedIds.ASSISTANT_COACH, "assistant", "Marcus", "Sorg",
                "assistant@mscms.com", "+34600000050", 58, Gender.MALE, "Barcelona", Role.STAFF);
        ac.setSportId(1L);
        ac.setTeamId(1L);
        ac.setStaffrole(StaffRole.ASSISTANT_COACH);
        ac.setTeamManager(tm);
        ac.setSpecialty("Tactics & set pieces");
        return assistantCoachRepository.save(ac);
    }

    private PerformanceAnalyst savePerformanceAnalyst(TeamManager tm) {
        PerformanceAnalyst pa = new PerformanceAnalyst();
        applyCommon(pa, SeedIds.PERFORMANCE_ANALYST, "analyst", "Sergi", "Domínguez",
                "analyst@mscms.com", "+34600000051", 39, Gender.MALE, "Barcelona", Role.STAFF);
        pa.setSportId(1L);
        pa.setTeamId(1L);
        pa.setStaffrole(StaffRole.PERFORMANCE_ANALYST);
        pa.setTeamManager(tm);
        pa.setYearsExperience(10);
        pa.setToolsUsed("Wyscout, InStat, Hudl");
        return performanceAnalystRepository.save(pa);
    }

    private SpecificCoach saveSpecificCoach(TeamManager tm) {
        SpecificCoach sc = new SpecificCoach();
        applyCommon(sc, SeedIds.SPECIFIC_COACH, "gkcoach", "José Ramón", "de la Fuente",
                "gkcoach@mscms.com", "+34600000052", 52, Gender.MALE, "Barcelona", Role.STAFF);
        sc.setSportId(1L);
        sc.setTeamId(1L);
        sc.setStaffrole(StaffRole.SPECIFIC_COACH);
        sc.setTeamManager(tm);
        sc.setSkillType("Goalkeeping");
        return specificCoachRepository.save(sc);
    }

    private Admin saveAdmin2() {
        Admin a = new Admin();
        applyCommon(a, SeedIds.ADMIN_2, "admin2", "Backup", "Administrator",
                "admin2@mscms.com", "+34600000002", 35, Gender.MALE, "Barcelona", Role.ADMIN);
        return userRepository.save(a);
    }

    private Scout saveScout() {
        Scout s = new Scout();
        applyCommon(s, SeedIds.SCOUT, "scout", "Jordi", "Roura",
                "scout@mscms.com", "+34600000040", 58, Gender.MALE, "Barcelona", Role.SCOUT);
        s.setRegion("Europe");
        s.setOrganizationName("FC Barcelona Scouting Network");
        return scoutRepository.save(s);
    }

    private Sponsor saveSponsor() {
        Sponsor sp = new Sponsor();
        applyCommon(sp, SeedIds.SPONSOR, "sponsor", "Spotify", "Brand",
                "sponsor@mscms.com", "+34600000041", 40, Gender.FEMALE, "Barcelona", Role.SPONSOR);
        sp.setCompanyName("Spotify");
        return sponsorRepository.save(sp);
    }

    private Fan saveFan() {
        Fan f = new Fan();
        applyCommon(f, SeedIds.FAN, "fan", "Aleix", "Garcia",
                "fan@mscms.com", "+34600000042", 28, Gender.MALE, "Barcelona", Role.FAN);
        f.setDisplayName("Culer_4_Life");
        f.setFavoriteTeamId(1L);
        return fanRepository.save(f);
    }

    private Player savePlayer(String keycloakId, String username, String first, String last,
                              String email, String phone, int age, Gender gender, String address,
                              LocalDate dob, String nationality, Position position,
                              Long marketValue, Integer kit, Long rosterId, Long contractId,
                              String photoUrl, StatusOfPlayer status) {
        Player p = new Player();
        applyCommon(p, keycloakId, username, first, last, email, phone, age, gender, address, Role.PLAYER);
        p.setDateOfBirth(dob);
        p.setNationality(nationality);
        p.setPreferredPosition(position);
        p.setMarketValue(marketValue);
        p.setKitNumber(kit);
        p.setPhotoUrl(photoUrl);
        p.setRosterId(rosterId);
        p.setContractId(contractId);
        p.setStatus(status);
        return playerRepository.save(p);
    }

    private void applyCommon(User u, String keycloakId, String username, String first, String last,
                             String email, String phone, int age, Gender gender, String address, Role role) {
        u.setKeycloakId(keycloakId);
        u.setUsername(username);
        u.setFirstName(first);
        u.setLastName(last);
        u.setEmail(email);
        u.setPhone(phone);
        u.setAge(age);
        u.setGender(gender);
        u.setAddress(address);
        u.setRole(role);
    }

    private NationalTeam saveNationalTeam(String keycloakId, String username, String country,
                                          String displayName, String federationName,
                                          String contactPerson, String email) {
        NationalTeam nt = new NationalTeam();
        applyCommon(nt, keycloakId, username, displayName, country,
                email, "+34000000000", 0, Gender.MALE, country, Role.NATIONAL_TEAM);
        nt.setFederationName(federationName);
        nt.setContactPerson(contactPerson);
        nt.setCountry(country);
        return nationalTeamRepository.save(nt);
    }
}
