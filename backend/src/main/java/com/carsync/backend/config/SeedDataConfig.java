package com.carsync.backend.config;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class SeedDataConfig {
  @Bean
  CommandLineRunner seedDemoData(JdbcTemplate jdbcTemplate, PasswordEncoder passwordEncoder) {
    return args -> {
      Integer tenantCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM tenants", Integer.class);
      if (tenantCount != null && tenantCount > 0) {
        return;
      }

      jdbcTemplate.update("INSERT INTO tenants (name, city, slug) VALUES (?, ?, ?)", "Metro Wheels", "Bengaluru", "metro-wheels");
      Long tenantId = jdbcTemplate.queryForObject("SELECT MAX(id) FROM tenants", Long.class);

      jdbcTemplate.update("INSERT INTO dealerships (tenant_id, name, city) VALUES (?, ?, ?)", tenantId, "Metro Wheels", "Bengaluru");
      Long dealershipId = jdbcTemplate.queryForObject("SELECT MAX(id) FROM dealerships", Long.class);

      jdbcTemplate.update(
          "INSERT INTO users (tenant_id, name, email, password_hash) VALUES (?, ?, ?, ?)",
          tenantId,
          "Demo Admin",
          "admin@carsync.local",
          passwordEncoder.encode("password123")
      );

      Long arjun = insertCustomer(jdbcTemplate, tenantId, dealershipId, "Arjun Rao", "+91 9876543210", "Bengaluru", 500000, 700000);
      Long neha = insertCustomer(jdbcTemplate, tenantId, dealershipId, "Neha Sharma", "+91 9988776655", "Mysuru", 700000, 900000);
      Long imran = insertCustomer(jdbcTemplate, tenantId, dealershipId, "Imran Khan", "+91 9123456789", "Bengaluru", 350000, 500000);

      Long arjunLead = insertLead(jdbcTemplate, tenantId, dealershipId, arjun, "OLX", "Hyundai Creta SX", "TEST_DRIVE", 700000);
      Long nehaLead = insertLead(jdbcTemplate, tenantId, dealershipId, neha, "Walk-in", "Maruti Baleno Alpha", "NEGOTIATION", 900000);
      Long imranLead = insertLead(jdbcTemplate, tenantId, dealershipId, imran, "Facebook", "Honda City VX", "CONTACTED", 500000);

      Long creta = insertVehicle(jdbcTemplate, tenantId, dealershipId, "CS-201", "Hyundai Creta SX", "Hyundai", "Creta", 2020, "Petrol", "Manual", 42000, 895000, 820000, "White", "AVAILABLE");
      Long baleno = insertVehicle(jdbcTemplate, tenantId, dealershipId, "CS-184", "Maruti Baleno Alpha", "Maruti", "Baleno", 2019, "Petrol", "Automatic", 36000, 655000, 590000, "Blue", "RESERVED");
      insertVehicle(jdbcTemplate, tenantId, dealershipId, "CS-190", "Honda City VX", "Honda", "City", 2018, "Diesel", "Manual", 61000, 575000, 510000, "Grey", "AVAILABLE");

      insertFollowUp(jdbcTemplate, tenantId, dealershipId, arjun, arjunLead, "Confirm test drive slot", LocalDateTime.now().plusDays(1).withHour(16).withMinute(30), "Customer prefers late morning callbacks.", "PENDING");
      insertFollowUp(jdbcTemplate, tenantId, dealershipId, neha, nehaLead, "Send final offer", LocalDateTime.now().plusDays(1).withHour(20).withMinute(0), "Include exchange bonus details.", "PENDING");
      insertFollowUp(jdbcTemplate, tenantId, dealershipId, imran, imranLead, "Re-engage cold lead", LocalDateTime.now().plusDays(2).withHour(15).withMinute(0), "Pitch lower EMI angle.", "PENDING");

      insertBooking(jdbcTemplate, tenantId, dealershipId, neha, nehaLead, baleno, 25000, "UPI", LocalDate.now().plusDays(4));
      insertBooking(jdbcTemplate, tenantId, dealershipId, arjun, arjunLead, creta, 15000, "Cash", LocalDate.now().plusDays(6));
    };
  }

  private Long insertCustomer(JdbcTemplate jdbcTemplate, Long tenantId, Long dealershipId, String name, String phone, String city, int budgetMin, int budgetMax) {
    jdbcTemplate.update(
        "INSERT INTO customers (tenant_id, dealership_id, name, phone, city, budget_min, budget_max) VALUES (?, ?, ?, ?, ?, ?, ?)",
        tenantId, dealershipId, name, phone, city, budgetMin, budgetMax
    );
    return jdbcTemplate.queryForObject("SELECT MAX(id) FROM customers", Long.class);
  }

  private Long insertLead(JdbcTemplate jdbcTemplate, Long tenantId, Long dealershipId, Long customerId, String source, String interest, String status, int expectedPrice) {
    jdbcTemplate.update(
        "INSERT INTO leads (tenant_id, dealership_id, customer_id, source, interest, status, expected_price) VALUES (?, ?, ?, ?, ?, ?, ?)",
        tenantId, dealershipId, customerId, source, interest, status, expectedPrice
    );
    return jdbcTemplate.queryForObject("SELECT MAX(id) FROM leads", Long.class);
  }

  private Long insertVehicle(JdbcTemplate jdbcTemplate, Long tenantId, Long dealershipId, String stockCode, String title, String make, String model, int year, String fuel, String transmission, int mileageKm, int price, int purchasePrice, String color, String status) {
    jdbcTemplate.update(
        """
        INSERT INTO vehicles (
          tenant_id, dealership_id, stock_code, title, make_name, model_name, vehicle_year,
          fuel, transmission, mileage_km, price, purchase_price, color, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        tenantId, dealershipId, stockCode, title, make, model, year, fuel, transmission, mileageKm, price, purchasePrice, color, status
    );
    return jdbcTemplate.queryForObject("SELECT MAX(id) FROM vehicles", Long.class);
  }

  private void insertFollowUp(JdbcTemplate jdbcTemplate, Long tenantId, Long dealershipId, Long customerId, Long leadId, String title, LocalDateTime dueAt, String notes, String status) {
    jdbcTemplate.update(
        "INSERT INTO follow_ups (tenant_id, dealership_id, customer_id, lead_id, title, due_at, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        tenantId, dealershipId, customerId, leadId, title, Timestamp.valueOf(dueAt), notes, status
    );
  }

  private void insertBooking(JdbcTemplate jdbcTemplate, Long tenantId, Long dealershipId, Long customerId, Long leadId, Long vehicleId, int amount, String paymentMode, LocalDate deliveryDate) {
    jdbcTemplate.update(
        "INSERT INTO bookings (tenant_id, dealership_id, customer_id, vehicle_id, lead_id, amount, payment_mode, delivery_date, booking_price, final_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        tenantId, dealershipId, customerId, vehicleId, leadId, amount, paymentMode, deliveryDate, amount, amount
    );
  }
}
