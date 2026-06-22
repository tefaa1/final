package com.example.notificationmessagingservice.config;

import com.example.notificationmessagingservice.websocket.ChatWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

/**
 * Registers the raw team-chat WebSocket at /ws/chat.
 *
 * The browser connects directly to this service's published port
 * (ws://localhost:8085/ws/chat), bypassing the gateway's JWT filter — the native
 * browser WebSocket API cannot attach an Authorization header, and this service
 * is permitAll. The path is /ws/chat (NOT under /messages) on purpose: a path
 * like /messages/ws collides with the MessageController's GET /messages/{id}
 * mapping (Spring tries to bind "ws" as a Long and returns 400 before the WS
 * upgrade runs). /ws/** matches no controller, so the upgrade handshake wins.
 */
@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class ChatWebSocketConfig implements WebSocketConfigurer {

    private final ChatWebSocketHandler chatWebSocketHandler;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(chatWebSocketHandler, "/ws/chat")
                .setAllowedOriginPatterns("*");
    }
}
