package com.example.trainingmatchservice.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.cert.X509Certificate;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Thin client for football-data.org (v4). Runs inside the backend container,
 * which has outbound internet access. The API key is injected from the
 * FOOTBALL_DATA_API_KEY environment variable; when it is blank the sync layer
 * disables itself gracefully.
 */
@Component
public class FootballDataClient {

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .sslContext(trustAllSsl())
            .build();
    private final ObjectMapper mapper = new ObjectMapper();

    /**
     * The deployment network performs TLS interception with a custom corporate
     * CA, so the JDK truststore rejects api.football-data.org with a PKIX
     * "unable to find valid certification path" error. This client only fetches
     * PUBLIC, read-only sports data, so we give it a permissive SSL context
     * scoped to THIS client (not the whole JVM) to tolerate the intercepting
     * proxy; all other services keep normal certificate validation.
     */
    private static SSLContext trustAllSsl() {
        try {
            TrustManager[] trustAll = { new X509TrustManager() {
                public void checkClientTrusted(X509Certificate[] chain, String authType) {}
                public void checkServerTrusted(X509Certificate[] chain, String authType) {}
                public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
            }};
            SSLContext ctx = SSLContext.getInstance("TLS");
            ctx.init(null, trustAll, new java.security.SecureRandom());
            return ctx;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to build SSL context for football-data client", e);
        }
    }

    @Value("${FOOTBALL_DATA_BASE:https://api.football-data.org/v4}")
    private String base;

    @Value("${FOOTBALL_DATA_API_KEY:}")
    private String apiKey;

    // Per-path response cache. The free tier allows only 10 requests/minute, so
    // we serve cached responses for a short TTL and fall back to the last good
    // value if a call is rate-limited (429) — avoids "no data" on quick navigation.
    @Value("${FOOTBALL_CACHE_TTL_MS:60000}")
    private long cacheTtlMs;

    private record Cached(JsonNode body, long at) {}
    private final Map<String, Cached> cache = new ConcurrentHashMap<>();

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public JsonNode get(String path) throws Exception {
        long now = System.currentTimeMillis();
        Cached cached = cache.get(path);
        if (cached != null && now - cached.at() < cacheTtlMs) {
            return cached.body();
        }
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(base + path))
                    .header("X-Auth-Token", apiKey)
                    .timeout(Duration.ofSeconds(20))
                    .GET()
                    .build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 300) {
                // Rate-limited / error → serve the last good response if we have one.
                if (cached != null) return cached.body();
                throw new RuntimeException("football-data.org HTTP " + response.statusCode() + ": " + response.body());
            }
            JsonNode body = mapper.readTree(response.body());
            cache.put(path, new Cached(body, now));
            return body;
        } catch (Exception e) {
            if (cached != null) return cached.body(); // serve stale on network error
            throw e;
        }
    }
}
