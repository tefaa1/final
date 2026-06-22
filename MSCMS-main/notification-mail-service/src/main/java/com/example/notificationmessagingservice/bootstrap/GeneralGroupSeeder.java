package com.example.notificationmessagingservice.bootstrap;

import com.example.notificationmessagingservice.model.entity.ChatGroup;
import com.example.notificationmessagingservice.repository.ChatGroupRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/** Ensures the single club-wide General group exists. Everyone belongs to it. */
@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class GeneralGroupSeeder implements CommandLineRunner {

    private final ChatGroupRepository groupRepo;

    @Override
    public void run(String... args) {
        if (groupRepo.findByIsGeneralTrue().isEmpty()) {
            ChatGroup g = new ChatGroup();
            g.setName("FC Barcelona — Team Group");
            g.setDescription("The whole club. Every member of the system is here.");
            g.setPhotoUrl("https://crests.football-data.org/81.png");
            g.setIsGeneral(true);
            g.setCreatedByKeycloakId("system");
            g.setCreatedAt(LocalDateTime.now());
            groupRepo.save(g);
            log.info("Seeded General chat group id={}", g.getId());
        }
    }
}
