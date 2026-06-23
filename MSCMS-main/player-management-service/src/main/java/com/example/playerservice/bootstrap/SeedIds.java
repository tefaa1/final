package com.example.playerservice.bootstrap;

public final class SeedIds {
    private SeedIds() {}

    public static final String SPORT_MANAGER  = "00000000-0000-0000-0000-000000000010";

    public static final String PLAYER_1_STRIKER = "00000000-0000-0000-0000-000000000101";
    public static final String PLAYER_2_MID     = "00000000-0000-0000-0000-000000000102";
    public static final String PLAYER_3_DEF     = "00000000-0000-0000-0000-000000000103";
    public static final String PLAYER_4_GK      = "00000000-0000-0000-0000-000000000104";
    public static final String PLAYER_5_BBALL   = "00000000-0000-0000-0000-000000000105";
    public static final String PLAYER_6_TENNIS  = "00000000-0000-0000-0000-000000000106";

    // Handball squad (FC Barcelona Handbol)
    public static final String PLAYER_7_HB_BACK   = "00000000-0000-0000-0000-000000000107";
    public static final String PLAYER_8_HB_CB     = "00000000-0000-0000-0000-000000000108";
    public static final String PLAYER_9_HB_WING   = "00000000-0000-0000-0000-000000000109";
    public static final String PLAYER_10_HB_PIVOT = "00000000-0000-0000-0000-000000000110";

    // Extended FC Barcelona football squad (keycloak ids 111..126)
    public static final String PLAYER_11_GK  = "00000000-0000-0000-0000-000000000111";
    public static final String PLAYER_12_CB  = "00000000-0000-0000-0000-000000000112";
    public static final String PLAYER_13_CB  = "00000000-0000-0000-0000-000000000113";
    public static final String PLAYER_14_RB  = "00000000-0000-0000-0000-000000000114";
    public static final String PLAYER_15_LB  = "00000000-0000-0000-0000-000000000115";
    public static final String PLAYER_16_RB  = "00000000-0000-0000-0000-000000000116";
    public static final String PLAYER_17_CM  = "00000000-0000-0000-0000-000000000117";
    public static final String PLAYER_18_CM  = "00000000-0000-0000-0000-000000000118";
    public static final String PLAYER_19_CM  = "00000000-0000-0000-0000-000000000119";
    public static final String PLAYER_20_CDM = "00000000-0000-0000-0000-000000000120";
    public static final String PLAYER_21_CM  = "00000000-0000-0000-0000-000000000121";
    public static final String PLAYER_22_RW  = "00000000-0000-0000-0000-000000000122";
    public static final String PLAYER_23_RW  = "00000000-0000-0000-0000-000000000123";
    public static final String PLAYER_24_LW  = "00000000-0000-0000-0000-000000000124";
    public static final String PLAYER_25_LW  = "00000000-0000-0000-0000-000000000125";
    public static final String PLAYER_26_ST  = "00000000-0000-0000-0000-000000000126";

    // Matches user-management user_profiles insert order (admin=1, then 16 demo users)
    // Player rows 1..10 are inserted before the national teams → ids 12..21.
    public static final long PLAYER_1_ID  = 12L;
    public static final long PLAYER_2_ID  = 13L;
    public static final long PLAYER_3_ID  = 14L;
    public static final long PLAYER_4_ID  = 15L;
    public static final long PLAYER_5_ID  = 16L;
    public static final long PLAYER_6_ID  = 17L;
    public static final long PLAYER_7_ID  = 18L;
    public static final long PLAYER_8_ID  = 19L;
    public static final long PLAYER_9_ID  = 20L;
    public static final long PLAYER_10_ID = 21L;

    // The 16 extended squad players are appended AFTER the 2 national teams
    // (ids 22,23) in UserDataSeeder → they receive numeric ids 24..39.
    public static final long PLAYER_11_ID = 24L;
    public static final long PLAYER_12_ID = 25L;
    public static final long PLAYER_13_ID = 26L;
    public static final long PLAYER_14_ID = 27L;
    public static final long PLAYER_15_ID = 28L;
    public static final long PLAYER_16_ID = 29L;
    public static final long PLAYER_17_ID = 30L;
    public static final long PLAYER_18_ID = 31L;
    public static final long PLAYER_19_ID = 32L;
    public static final long PLAYER_20_ID = 33L;
    public static final long PLAYER_21_ID = 34L;
    public static final long PLAYER_22_ID = 35L;
    public static final long PLAYER_23_ID = 36L;
    public static final long PLAYER_24_ID = 37L;
    public static final long PLAYER_25_ID = 38L;
    public static final long PLAYER_26_ID = 39L;

    // ─── Extended Basketball + Handball squads ──────────────────────────────
    // keycloak ids
    public static final String BB_VESELY      = "00000000-0000-0000-0000-000000000211";
    public static final String BB_HERNANGOMEZ = "00000000-0000-0000-0000-000000000212";
    public static final String BB_SHENGELIA   = "00000000-0000-0000-0000-000000000213";
    public static final String BB_PARKER      = "00000000-0000-0000-0000-000000000214";
    public static final String BB_ABRINES     = "00000000-0000-0000-0000-000000000215";
    public static final String BB_BRIZUELA    = "00000000-0000-0000-0000-000000000216";
    public static final String BB_PUNTER      = "00000000-0000-0000-0000-000000000217";
    public static final String BB_LAPROVITTOLA= "00000000-0000-0000-0000-000000000218";
    public static final String BB_JOKUBAITIS  = "00000000-0000-0000-0000-000000000219";
    public static final String HB_PDV         = "00000000-0000-0000-0000-000000000231";
    public static final String HB_NIELSEN     = "00000000-0000-0000-0000-000000000232";
    public static final String HB_RICHARDSON  = "00000000-0000-0000-0000-000000000233";
    public static final String HB_CINDRIC     = "00000000-0000-0000-0000-000000000234";
    public static final String HB_NGUESSAN    = "00000000-0000-0000-0000-000000000235";
    public static final String HB_JANC        = "00000000-0000-0000-0000-000000000236";
    public static final String HB_URDANGARIN  = "00000000-0000-0000-0000-000000000237";

    // numeric user ids — appended after admin2 (id 43) → 44..59
    public static final long BB_VESELY_ID      = 44L;
    public static final long BB_HERNANGOMEZ_ID = 45L;
    public static final long BB_SHENGELIA_ID   = 46L;
    public static final long BB_PARKER_ID      = 47L;
    public static final long BB_ABRINES_ID     = 48L;
    public static final long BB_BRIZUELA_ID    = 49L;
    public static final long BB_PUNTER_ID      = 50L;
    public static final long BB_LAPROVITTOLA_ID= 51L;
    public static final long BB_JOKUBAITIS_ID  = 52L;
    public static final long HB_PDV_ID         = 53L;
    public static final long HB_NIELSEN_ID     = 54L;
    public static final long HB_RICHARDSON_ID  = 55L;
    public static final long HB_CINDRIC_ID     = 56L;
    public static final long HB_NGUESSAN_ID    = 57L;
    public static final long HB_JANC_ID        = 58L;
    public static final long HB_URDANGARIN_ID  = 59L;

    // ─── Extended Tennis squad (Barça Tennis Academy) ───────────────────────
    public static final String TN_ALCARAZ  = "00000000-0000-0000-0000-000000000241";
    public static final String TN_NADAL    = "00000000-0000-0000-0000-000000000242";
    public static final String TN_BADOSA   = "00000000-0000-0000-0000-000000000243";
    public static final String TN_MUGURUZA = "00000000-0000-0000-0000-000000000244";
    public static final String TN_CARRENO  = "00000000-0000-0000-0000-000000000245";
    public static final String TN_BAUTISTA = "00000000-0000-0000-0000-000000000246";
    public static final long TN_ALCARAZ_ID  = 60L;
    public static final long TN_NADAL_ID     = 61L;
    public static final long TN_BADOSA_ID    = 62L;
    public static final long TN_MUGURUZA_ID  = 63L;
    public static final long TN_CARRENO_ID   = 64L;
    public static final long TN_BAUTISTA_ID  = 65L;

    // ─── SECOND TEAMS (reserve squads) ──────────────────────────────────────
    // Reserve players are appended in user-management AFTER the tennis squad
    // (last id 65), so they receive numeric ids 66..89. Order MUST match the
    // savePlayer order in UserDataSeeder.
    // FC Barcelona Atlètic (football B, team 6) — 11 players, ids 66..76
    public static final long FBB_KOCHEN_ID  = 66L;
    public static final long FBB_FORT_ID    = 67L;
    public static final long FBB_CUENCA_ID  = 68L;
    public static final long FBB_FAYE_ID    = 69L;
    public static final long FBB_MARTIN_ID  = 70L;
    public static final long FBB_BERNAL_ID  = 71L;
    public static final long FBB_PRIM_ID    = 72L;
    public static final long FBB_UNAI_ID    = 73L;
    public static final long FBB_TONI_ID    = 74L;
    public static final long FBB_DANI_ID    = 75L;
    public static final long FBB_VICTOR_ID  = 76L;
    // FC Barcelona Bàsquet B (basketball B, team 7) — 6 players, ids 77..82
    public static final long BBB_MOLINS_ID    = 77L;
    public static final long BBB_MARA_ID      = 78L;
    public static final long BBB_CANO_ID      = 79L;
    public static final long BBB_KEITA_ID     = 80L;
    public static final long BBB_HALPIN_ID    = 81L;
    public static final long BBB_ESPINET_ID   = 82L;
    // FC Barcelona Handbol B (handball B, team 8) — 7 players, ids 83..89
    public static final long HBB_MESTRE_ID    = 83L;
    public static final long HBB_VALERA_ID    = 84L;
    public static final long HBB_GURRI_ID     = 85L;
    public static final long HBB_REY_ID       = 86L;
    public static final long HBB_BARRUFET_ID  = 87L;
    public static final long HBB_CANELLAS_ID  = 88L;
    public static final long HBB_RIBAS_ID     = 89L;
}
