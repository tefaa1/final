package com.example.trainingmatchservice.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Client for API-Football (api-sports.io v3). Unlike football-data.org's free
 * tier, this exposes a team's UPCOMING fixtures including friendlies/pre-season
 * — which is what we need for "next 2 months". Key from APIFOOTBALL_KEY env.
 */
@Component
public class ApiFootballClient {

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${APIFOOTBALL_BASE:https://v3.football.api-sports.io}")
    private String base;

    @Value("${APIFOOTBALL_KEY:}")
    private String apiKey;

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public JsonNode get(String path) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(base + path))
                .header("x-apisports-key", apiKey)
                .timeout(Duration.ofSeconds(20))
                .GET()
                .build();
        HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 300) {
            throw new RuntimeException("api-football HTTP " + response.statusCode() + ": " + response.body());
        }
        return mapper.readTree(response.body());
    }
}
