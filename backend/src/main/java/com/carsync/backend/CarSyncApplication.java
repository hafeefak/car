package com.carsync.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;


import java.util.TimeZone;


@SpringBootApplication
public class CarSyncApplication {
  public static void main(String[] args) {
    TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata"));
    SpringApplication.run(CarSyncApplication.class, args);
  }
}
