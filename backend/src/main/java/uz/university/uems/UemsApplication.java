package uz.university.uems;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class UemsApplication {
    public static void main(String[] args) {
        SpringApplication.run(UemsApplication.class, args);
    }
}
