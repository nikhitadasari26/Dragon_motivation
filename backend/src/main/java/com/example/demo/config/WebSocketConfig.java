package com.example.demo.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${app.cors.allowed-origins:http://localhost:3000}")
    private String allowedOrigins;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Support direct native STOMP WebSocket connections on both standard paths
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");
        registry.addEndpoint("/ws/websocket")
                .setAllowedOriginPatterns("*");
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Topic endpoint for subscriptions (e.g. subscribing to /topic/partner/{userId})
        registry.enableSimpleBroker("/topic");
        // Application prefix for messages sent by the client to the server
        registry.setApplicationDestinationPrefixes("/app");
    }
}
