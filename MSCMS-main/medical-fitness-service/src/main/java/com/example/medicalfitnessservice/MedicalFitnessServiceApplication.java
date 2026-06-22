package com.example.medicalfitnessservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MedicalFitnessServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(MedicalFitnessServiceApplication.class, args);
    }

}
