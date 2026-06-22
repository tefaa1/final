package com.example.trainingmatchservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TrainingMatchServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(TrainingMatchServiceApplication.class, args);
    }

}
