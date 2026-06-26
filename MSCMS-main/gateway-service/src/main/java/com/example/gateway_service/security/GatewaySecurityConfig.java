package com.example.gateway_service.security;

import com.example.gateway_service.exception.CustomAuthErrorHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.config.Customizer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

import java.util.Collection;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@Configuration
@RequiredArgsConstructor
public class GatewaySecurityConfig {

    private final CustomAuthErrorHandler authErrorHandler;

    @Bean
    public JwtDecoder jwtDecoder(
            @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri}") String jwkSetUri) {
        return NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        JwtAuthenticationConverter jwtAuthConverter = new JwtAuthenticationConverter();
        jwtAuthConverter.setJwtGrantedAuthoritiesConverter(this::extractAuthorities);

        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .requestMatchers("/v3/api-docs/**", "/v3/api-docs.yaml", "/v3/api-docs.json").permitAll()
                        .requestMatchers("/webjars/**", "/swagger-resources/**", "/swagger-ui.html/**").permitAll()
                        .requestMatchers("/api-docs/**", "/api-docs.yaml", "/api-docs.json").permitAll()
                        .requestMatchers("/*/v3/api-docs/**").permitAll()

                        .requestMatchers("/actuator/**", "/eureka/**").permitAll()

                        // Auth endpoints
                        .requestMatchers("/auth/login", "/auth/signup", "/auth/refresh").permitAll()
                        .requestMatchers("/auth/admin/**").hasRole("ADMIN")
                        .requestMatchers("/auth/logout").authenticated()

                        // ADMIN-only (User Management)
                        .requestMatchers(HttpMethod.POST, "/users/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/users/**").hasRole("ADMIN")
                        .requestMatchers("/sport-managers/**").hasAnyRole("ADMIN", "SPORT_MANAGER")
                        .requestMatchers("/team-managers/**").hasAnyRole("ADMIN", "SPORT_MANAGER", "TEAM_MANAGER")
                        .requestMatchers("/staff/**").hasAnyRole("ADMIN", "SPORT_MANAGER", "TEAM_MANAGER")

                        // Players: any authenticated user may VIEW the squad (Club Hub, dashboard,
                        // key players); writes stay staff-only. The GET rule MUST come FIRST — the
                        // method-specific write matchers below would otherwise shadow the squad read.
                        .requestMatchers(HttpMethod.GET, "/players/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/players/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/players/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/players/**").hasAnyRole(
                                "ADMIN", "HEAD_COACH")

                        // ===== Medical & Fitness =====
                        // READ access for medical staff, head coach, fitness coach + the player (own record)
                        .requestMatchers(HttpMethod.GET, "/injuries/**", "/diagnoses/**", "/treatments/**",
                                "/rehabilitations/**", "/recovery-programs/**", "/fitness-tests/**").hasAnyRole(
                                "ADMIN", "TEAM_DOCTOR", "PHYSIOTHERAPIST", "HEAD_COACH", "FITNESS_COACH", "PLAYER")
                        .requestMatchers("/injuries/**").hasAnyRole(
                                "ADMIN", "TEAM_DOCTOR", "PHYSIOTHERAPIST", "HEAD_COACH")
                        .requestMatchers("/diagnoses/**").hasAnyRole(
                                "ADMIN", "TEAM_DOCTOR")
                        // Treatment → doctor only; rehab & recovery → physio only; fitness test → fitness coach only.
                        .requestMatchers("/treatments/**").hasAnyRole(
                                "ADMIN", "TEAM_DOCTOR")
                        .requestMatchers("/rehabilitations/**").hasAnyRole(
                                "ADMIN", "PHYSIOTHERAPIST")
                        .requestMatchers("/recovery-programs/**").hasAnyRole(
                                "ADMIN", "PHYSIOTHERAPIST")
                        .requestMatchers("/fitness-tests/**").hasAnyRole(
                                "ADMIN", "FITNESS_COACH")
                        .requestMatchers("/training-loads/**").hasAnyRole(
                                "ADMIN", "FITNESS_COACH", "HEAD_COACH", "PERFORMANCE_ANALYST")

                        // ===== Training & Match =====
                        // READ access for staff + the player viewing their own plan/sessions/drills
                        .requestMatchers(HttpMethod.GET, "/training-sessions/**", "/training-plans/**",
                                "/training-drills/**", "/training-attendance/**", "/player-training-assessments/**").hasAnyRole(
                                "ADMIN", "HEAD_COACH", "ASSISTANT_COACH", "SPECIFIC_COACH", "FITNESS_COACH",
                                "TEAM_MANAGER", "TEAM_DOCTOR", "PHYSIOTHERAPIST", "PLAYER")
                        .requestMatchers("/training-sessions/**").hasAnyRole(
                                "ADMIN", "HEAD_COACH", "ASSISTANT_COACH", "SPECIFIC_COACH", "FITNESS_COACH")
                        .requestMatchers("/training-plans/**").hasAnyRole(
                                "ADMIN", "HEAD_COACH", "ASSISTANT_COACH")
                        .requestMatchers("/training-drills/**").hasAnyRole(
                                "ADMIN", "HEAD_COACH", "ASSISTANT_COACH", "SPECIFIC_COACH")
                        .requestMatchers("/training-attendance/**").hasAnyRole(
                                "ADMIN", "HEAD_COACH", "ASSISTANT_COACH")
                        .requestMatchers("/player-training-assessments/**").hasAnyRole(
                                "ADMIN", "HEAD_COACH", "ASSISTANT_COACH", "SPECIFIC_COACH", "FITNESS_COACH")
                        // Spectator READ access — fixtures, results, competitions, standings, World Cup,
                        // head-to-head (all under /matches/**) + match detail — any authenticated user.
                        .requestMatchers(HttpMethod.GET, "/matches/**", "/match-events/**", "/match-formations/**",
                                "/match-lineups/**", "/player-match-statistics/**", "/match-performance-reviews/**").authenticated()
                        .requestMatchers("/matches/**").hasAnyRole(
                                "ADMIN", "HEAD_COACH", "ASSISTANT_COACH", "PERFORMANCE_ANALYST")
                        .requestMatchers("/match-events/**").hasAnyRole(
                                "ADMIN", "HEAD_COACH", "PERFORMANCE_ANALYST")
                        .requestMatchers("/match-formations/**").hasAnyRole(
                                "ADMIN", "HEAD_COACH")
                        .requestMatchers("/match-lineups/**").hasAnyRole(
                                "ADMIN", "HEAD_COACH")
                        // Player performance reviews: any staff role that sees the "Add player
                        // review" composer (everyone except read-only fan/player) may create one.
                        .requestMatchers("/match-performance-reviews/**").hasAnyRole(
                                "ADMIN", "HEAD_COACH", "ASSISTANT_COACH", "SPECIFIC_COACH", "FITNESS_COACH",
                                "PERFORMANCE_ANALYST", "TEAM_DOCTOR", "PHYSIOTHERAPIST", "TEAM_MANAGER",
                                "SPORT_MANAGER", "SCOUT", "SPONSOR")
                        .requestMatchers("/player-match-statistics/**").hasAnyRole(
                                "ADMIN", "HEAD_COACH", "PERFORMANCE_ANALYST")

                        // ===== Player Management =====
                        // Club Hub / squad viewing — any authenticated user may READ teams, sports, rosters.
                        .requestMatchers(HttpMethod.GET, "/teams/**", "/sports/**", "/rosters/**").authenticated()
                        .requestMatchers("/teams/**").hasAnyRole(
                                "ADMIN", "SPORT_MANAGER", "TEAM_MANAGER", "HEAD_COACH")
                        .requestMatchers("/sports/**").hasAnyRole(
                                "ADMIN", "SPORT_MANAGER")
                        .requestMatchers("/rosters/**").hasAnyRole(
                                "ADMIN", "HEAD_COACH", "TEAM_MANAGER")
                        .requestMatchers("/player-contracts/**").hasAnyRole(
                                "ADMIN", "SPORT_MANAGER", "TEAM_MANAGER")
                        .requestMatchers("/player-transfers-incoming/**").hasAnyRole(
                                "ADMIN", "SPORT_MANAGER")
                        .requestMatchers("/player-transfers-outgoing/**").hasAnyRole(
                                "ADMIN", "SPORT_MANAGER")
                        .requestMatchers("/player-callups/**").hasAnyRole(
                                "ADMIN", "HEAD_COACH", "NATIONAL_TEAM")
                        .requestMatchers("/outer-players/**").hasAnyRole(
                                "ADMIN", "SCOUT")
                        .requestMatchers("/outer-teams/**").hasAnyRole(
                                "ADMIN", "SCOUT")

                        // ===== Notification & Mail =====
                        .requestMatchers("/notifications/**").authenticated()
                        .requestMatchers("/alerts/**").hasAnyRole(
                                "ADMIN", "HEAD_COACH", "TEAM_DOCTOR")
                        // /messages backs BOTH team chat AND the community match-review wall, so it
                        // must allow every authenticated user (incl. fans posting match reviews). The
                        // team-chat PAGE stays fan-free via the frontend route guard + locked screen.
                        .requestMatchers("/messages/**").authenticated()

                        // ===== Reports & Analytics =====
                        .requestMatchers("/match-analyses/**").hasAnyRole(
                                "ADMIN", "HEAD_COACH", "PERFORMANCE_ANALYST")
                        .requestMatchers("/player-analytics/**").hasAnyRole(
                                "ADMIN", "HEAD_COACH", "PERFORMANCE_ANALYST", "SCOUT")
                        .requestMatchers("/scout-reports/**").hasAnyRole(
                                "ADMIN", "SCOUT")
                        // Any authenticated user may VIEW offers (the service hides the amount for
                        // non-admin / non-owner); only admin & sponsors create / act on them.
                        .requestMatchers(HttpMethod.GET, "/sponsor-offers/**").authenticated()
                        .requestMatchers("/sponsor-offers/**").hasAnyRole(
                                "ADMIN", "SPONSOR")
                        .requestMatchers("/team-analytics/**").hasAnyRole(
                                "ADMIN", "HEAD_COACH", "PERFORMANCE_ANALYST")
                        .requestMatchers("/training-analytics/**").hasAnyRole(
                                "ADMIN", "HEAD_COACH", "FITNESS_COACH", "PERFORMANCE_ANALYST")

                        // ===== ML Models (Python FastAPI proxied through gateway) =====
                        .requestMatchers("/ml/match-prediction").hasAnyRole(
                                "ADMIN", "HEAD_COACH", "ASSISTANT_COACH", "PERFORMANCE_ANALYST")
                        .requestMatchers("/ml/player-rating/**").hasAnyRole(
                                "ADMIN", "HEAD_COACH", "PERFORMANCE_ANALYST", "SCOUT")

                        // ===== Role-specific =====
                        .requestMatchers("/scouts/**").hasAnyRole("ADMIN", "SCOUT")
                        .requestMatchers("/sponsors/**").hasAnyRole("ADMIN", "SPONSOR")
                        .requestMatchers("/national-teams/**").hasAnyRole("ADMIN", "NATIONAL_TEAM")
                        .requestMatchers("/fans/**").hasAnyRole("ADMIN", "FAN")

                        // Fallback — deny unauthenticated
                        .anyRequest().authenticated())

                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthConverter))
                        .authenticationEntryPoint(authErrorHandler))
                .exceptionHandling(ex -> ex
                        .accessDeniedHandler(authErrorHandler));

        return http.build();
    }

    private Collection<GrantedAuthority> extractAuthorities(Jwt jwt) {
        Set<GrantedAuthority> authorities = new HashSet<>();

        // realm_access (realm roles)
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess != null) {
            Object rolesObj = realmAccess.get("roles");
            if (rolesObj instanceof Collection<?> roles) {
                for (Object role : roles) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
                }
            }
        }

        return authorities;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setExposedHeaders(Arrays.asList("authorization", "x-auth-token"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
