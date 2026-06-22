package com.example.reportsanalyticsservice.config;

import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatusCode;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.support.RestClientAdapter;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;
import com.example.reportsanalyticsservice.client.UserClient;
import com.example.reportsanalyticsservice.client.TeamClient;

@Configuration
public class ClientConfig {
    @Bean @LoadBalanced
    public RestClient.Builder restClientBuilder() { return RestClient.builder(); }

    @Bean
    public UserClient userClient(RestClient.Builder restClientBuilder) {
        RestClient restClient = restClientBuilder.baseUrl("lb://USER-MANAGEMENT-SERVICE")
                .defaultStatusHandler(HttpStatusCode::is4xxClientError,
                        (request, response) -> { throw new RuntimeException("4xx error from user service: " + response.getStatusCode()); })
                .build();
        return HttpServiceProxyFactory.builderFor(RestClientAdapter.create(restClient)).build().createClient(UserClient.class);
    }

    @Bean
    public TeamClient teamClient(RestClient.Builder restClientBuilder) {
        RestClient restClient = restClientBuilder.baseUrl("lb://PLAYER-MANAGEMENT-SERVICE")
                .defaultStatusHandler(HttpStatusCode::is4xxClientError,
                        (request, response) -> { throw new RuntimeException("4xx error from player service: " + response.getStatusCode()); })
                .build();
        return HttpServiceProxyFactory.builderFor(RestClientAdapter.create(restClient)).build().createClient(TeamClient.class);
    }
}
