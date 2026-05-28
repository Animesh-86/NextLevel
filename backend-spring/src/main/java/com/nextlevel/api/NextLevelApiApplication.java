package com.nextlevel.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class NextLevelApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(NextLevelApiApplication.class, args);
    }
}
