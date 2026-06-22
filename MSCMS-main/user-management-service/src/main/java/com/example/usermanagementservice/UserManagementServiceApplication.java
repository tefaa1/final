package com.example.usermanagementservice;

import com.example.usermanagementservice.config.AdminProperties;
import com.example.usermanagementservice.model.entity.Admin;
import com.example.usermanagementservice.model.enums.Gender;
import com.example.usermanagementservice.model.enums.Role;
import com.example.usermanagementservice.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.context.annotation.Bean;
import org.springframework.core.annotation.Order;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.Optional;

@EnableJpaAuditing
@EnableScheduling
@EnableDiscoveryClient
@SpringBootApplication
public class UserManagementServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(UserManagementServiceApplication.class, args);
    }

    @Bean
    @Order(10)
    CommandLineRunner initAdmin(UserRepository userRepository, AdminProperties adminProps) {

        return args -> {
            String adminEmail = adminProps.getEmail();

            Optional<Admin> existingAdmin = userRepository.findByEmail(adminEmail)
                    .filter(user -> user instanceof Admin)
                    .map(user -> (Admin) user);

            if (existingAdmin.isEmpty()) {
                Admin admin = new Admin();
                admin.setKeycloakId(adminProps.getKeycloakId());
                admin.setAge(adminProps.getAge());
                admin.setFirstName(adminProps.getFirstName());
                admin.setLastName(adminProps.getLastName());
                admin.setEmail(adminProps.getEmail());
                admin.setPhone(adminProps.getPhone());
                admin.setUsername(adminProps.getUsername());
                admin.setRole(Role.valueOf(adminProps.getRole()));
                admin.setGender(Gender.valueOf(adminProps.getGender()));
                admin.setAddress(adminProps.getAddress());

                userRepository.save(admin);
                System.out.println("✓ Default admin created: " + adminEmail);
            } else {
                System.out.println("✓ Admin already exists: " + adminEmail);
            }
        };
    }
}
