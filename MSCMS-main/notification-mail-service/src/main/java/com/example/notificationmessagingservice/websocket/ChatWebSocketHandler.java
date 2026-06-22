package com.example.notificationmessagingservice.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Raw WebSocket hub for the team chat. The frontend connects (through the gateway)
 * to ws://&lt;gateway&gt;/messages/ws using the native browser WebSocket — no STOMP,
 * no client libraries.
 *
 * Protocol (JSON text frames):
 *   client -&gt; server  { "type":"identify", "user":"&lt;keycloakId&gt;", "name":"..." }
 *   client -&gt; server  { "type":"chat", "groupId":"...", "senderKeycloakId":"...", "senderName":"...", "content":"...", "sentAt":"..." }
 *   server -&gt; clients  (chat frames are re-broadcast verbatim to every connected client)
 *   server -&gt; clients  { "type":"presence", "online":&lt;n&gt;, "users":[...] }  (on every connect/identify/disconnect)
 *
 * Persistence is unchanged: the client still POSTs each chat message to /messages
 * (REST). This hub only handles real-time fan-out + live presence.
 */
@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper mapper = new ObjectMapper();
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final Map<String, String> sessionUser = new ConcurrentHashMap<>(); // sessionId -> keycloakId

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.put(session.getId(), session);
        broadcastPresence();
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session.getId());
        sessionUser.remove(session.getId());
        broadcastPresence();
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        try {
            JsonNode node = mapper.readTree(message.getPayload());
            String type = node.path("type").asText("");
            if ("identify".equals(type)) {
                String user = node.path("user").asText("");
                if (!user.isEmpty()) {
                    sessionUser.put(session.getId(), user);
                }
                broadcastPresence();
            } else if ("ping".equals(type)) {
                // keep-alive; nothing to do
            } else {
                // chat (and any other app frame) -> fan out verbatim to everyone
                broadcast(message.getPayload());
            }
        } catch (Exception ignored) {
            // ignore malformed frames
        }
    }

    private void broadcastPresence() {
        Set<String> users = new HashSet<>(sessionUser.values());
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "presence");
        payload.put("online", users.size());
        payload.put("users", new ArrayList<>(users));
        try {
            broadcast(mapper.writeValueAsString(payload));
        } catch (Exception ignored) {
        }
    }

    private void broadcast(String text) {
        TextMessage tm = new TextMessage(text);
        for (WebSocketSession s : sessions.values()) {
            try {
                if (s.isOpen()) {
                    s.sendMessage(tm);
                }
            } catch (IOException ignored) {
            }
        }
    }
}
