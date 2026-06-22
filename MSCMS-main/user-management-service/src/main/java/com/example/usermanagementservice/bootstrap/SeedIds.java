package com.example.usermanagementservice.bootstrap;

public final class SeedIds {
    private SeedIds() {}

    public static final String ADMIN          = "00000000-0000-0000-0000-000000000001";
    public static final String SPORT_MANAGER  = "00000000-0000-0000-0000-000000000010";
    public static final String TEAM_MANAGER   = "00000000-0000-0000-0000-000000000011";
    public static final String HEAD_COACH_FB  = "00000000-0000-0000-0000-000000000020";
    public static final String HEAD_COACH_BB  = "00000000-0000-0000-0000-000000000021";
    public static final String DOCTOR         = "00000000-0000-0000-0000-000000000030";
    public static final String PHYSIO         = "00000000-0000-0000-0000-000000000031";
    public static final String FITNESS_COACH  = "00000000-0000-0000-0000-000000000032";
    public static final String SCOUT          = "00000000-0000-0000-0000-000000000040";
    public static final String SPONSOR        = "00000000-0000-0000-0000-000000000041";
    public static final String FAN            = "00000000-0000-0000-0000-000000000042";

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

    // ─── Extended FC Barcelona football squad (full 20-man roster) ──────────
    // These 16 fill out the football team to match the ML dataset
    // (sportify-main/Evaluate Players/Football_Players_Data.csv). They have NO
    // Keycloak login accounts — they exist as profile/data records only.
    public static final String PLAYER_11_GK   = "00000000-0000-0000-0000-000000000111"; // Iñaki Peña
    public static final String PLAYER_12_CB   = "00000000-0000-0000-0000-000000000112"; // Andreas Christensen
    public static final String PLAYER_13_CB   = "00000000-0000-0000-0000-000000000113"; // Pau Cubarsí
    public static final String PLAYER_14_RB   = "00000000-0000-0000-0000-000000000114"; // Jules Koundé
    public static final String PLAYER_15_LB   = "00000000-0000-0000-0000-000000000115"; // Alejandro Balde
    public static final String PLAYER_16_RB   = "00000000-0000-0000-0000-000000000116"; // Sergi Roberto
    public static final String PLAYER_17_CM   = "00000000-0000-0000-0000-000000000117"; // Frenkie de Jong
    public static final String PLAYER_18_CM   = "00000000-0000-0000-0000-000000000118"; // Gavi
    public static final String PLAYER_19_CM   = "00000000-0000-0000-0000-000000000119"; // İlkay Gündoğan
    public static final String PLAYER_20_CDM  = "00000000-0000-0000-0000-000000000120"; // Oriol Romeu
    public static final String PLAYER_21_CM   = "00000000-0000-0000-0000-000000000121"; // Fermín López
    public static final String PLAYER_22_RW   = "00000000-0000-0000-0000-000000000122"; // Lamine Yamal
    public static final String PLAYER_23_RW   = "00000000-0000-0000-0000-000000000123"; // Raphinha
    public static final String PLAYER_24_LW   = "00000000-0000-0000-0000-000000000124"; // Ferran Torres
    public static final String PLAYER_25_LW   = "00000000-0000-0000-0000-000000000125"; // Ansu Fati
    public static final String PLAYER_26_ST   = "00000000-0000-0000-0000-000000000126"; // Vitor Roque

    // ─── Extended FC Barcelona Bàsquet squad (basketball, team 2) ───────────
    public static final String BB_VESELY      = "00000000-0000-0000-0000-000000000211";
    public static final String BB_HERNANGOMEZ = "00000000-0000-0000-0000-000000000212";
    public static final String BB_SHENGELIA   = "00000000-0000-0000-0000-000000000213";
    public static final String BB_PARKER      = "00000000-0000-0000-0000-000000000214";
    public static final String BB_ABRINES     = "00000000-0000-0000-0000-000000000215";
    public static final String BB_BRIZUELA    = "00000000-0000-0000-0000-000000000216";
    public static final String BB_PUNTER      = "00000000-0000-0000-0000-000000000217";
    public static final String BB_LAPROVITTOLA= "00000000-0000-0000-0000-000000000218";
    public static final String BB_JOKUBAITIS  = "00000000-0000-0000-0000-000000000219";

    // ─── Extended FC Barcelona Handbol squad (handball, team 5) ─────────────
    public static final String HB_PDV         = "00000000-0000-0000-0000-000000000231"; // Pérez de Vargas
    public static final String HB_NIELSEN     = "00000000-0000-0000-0000-000000000232";
    public static final String HB_RICHARDSON  = "00000000-0000-0000-0000-000000000233";
    public static final String HB_CINDRIC     = "00000000-0000-0000-0000-000000000234";
    public static final String HB_NGUESSAN    = "00000000-0000-0000-0000-000000000235";
    public static final String HB_JANC        = "00000000-0000-0000-0000-000000000236";
    public static final String HB_URDANGARIN  = "00000000-0000-0000-0000-000000000237";

    // ─── Extended Tennis squad (Barça Tennis Academy, team 3) ───────────────
    public static final String TN_ALCARAZ  = "00000000-0000-0000-0000-000000000241";
    public static final String TN_NADAL    = "00000000-0000-0000-0000-000000000242";
    public static final String TN_BADOSA   = "00000000-0000-0000-0000-000000000243";
    public static final String TN_MUGURUZA = "00000000-0000-0000-0000-000000000244";
    public static final String TN_CARRENO  = "00000000-0000-0000-0000-000000000245";
    public static final String TN_BAUTISTA = "00000000-0000-0000-0000-000000000246";

    // Extra staff (fill out previously-empty staff tables)
    public static final String ASSISTANT_COACH    = "00000000-0000-0000-0000-000000000050";
    public static final String PERFORMANCE_ANALYST = "00000000-0000-0000-0000-000000000051";
    public static final String SPECIFIC_COACH     = "00000000-0000-0000-0000-000000000052";
    public static final String ADMIN_2            = "00000000-0000-0000-0000-000000000002";
}
