package com.carsync.backend.service;

import com.carsync.backend.security.AuthUser;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CrmService {

  private final JdbcTemplate jdbcTemplate;

  public CrmService(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  // -------------------------------------------------------------------------
  // Snapshot
  // -------------------------------------------------------------------------

  public SnapshotResponse getSnapshot(AuthUser auth) {
    Long tenantId = auth.tenantId();

    int totalLeads = count("SELECT COUNT(*) FROM leads WHERE tenant_id = ?", tenantId);
    int openLeads = count("SELECT COUNT(*) FROM leads WHERE tenant_id = ? AND status NOT IN ('WON','LOST')", tenantId);
    int availableVehicles = count("SELECT COUNT(*) FROM vehicles WHERE tenant_id = ? AND status = 'AVAILABLE'", tenantId);
    int pendingFollowUps = count("SELECT COUNT(*) FROM follow_ups WHERE tenant_id = ? AND status = 'PENDING'", tenantId);
    int totalBookings = count("SELECT COUNT(*) FROM bookings WHERE tenant_id = ?", tenantId);

    return new SnapshotResponse(totalLeads, openLeads, availableVehicles, pendingFollowUps, totalBookings);
  }

  // -------------------------------------------------------------------------
  // Leads
  // -------------------------------------------------------------------------

  public List<LeadView> getLeads(AuthUser auth) {
    return jdbcTemplate.query(
        """
        SELECT l.id, l.source, l.interest, l.status, l.expected_price, l.created_at,
               c.id AS customer_id, c.name AS customer_name, c.phone AS customer_phone, c.city AS customer_city,
               c.budget_min, c.budget_max,
               f.title AS follow_up_title, f.due_at AS follow_up_due_at, f.notes AS follow_up_notes
        FROM leads l
        INNER JOIN customers c ON c.id = l.customer_id
        LEFT JOIN LATERAL (
          SELECT fu.title, fu.due_at, fu.notes
          FROM follow_ups fu
          WHERE fu.tenant_id = l.tenant_id AND fu.lead_id = l.id
          ORDER BY fu.due_at ASC NULLS LAST, fu.id DESC
          LIMIT 1
        ) f ON TRUE
        WHERE l.tenant_id = ?
        ORDER BY l.created_at DESC
        """,
        (rs, i) -> new LeadView(
            rs.getLong("id"),
            rs.getString("source"),
            rs.getString("interest"),
            rs.getString("status"),
            rs.getInt("expected_price"),
            rs.getObject("created_at", LocalDateTime.class),
            getNullableInteger(rs, "budget_min"),
            getNullableInteger(rs, "budget_max"),
            rs.getString("follow_up_title"),
            rs.getObject("follow_up_due_at", LocalDateTime.class),
            rs.getString("follow_up_notes"),
            new CustomerSummary(
                rs.getLong("customer_id"),
                rs.getString("customer_name"),
                rs.getString("customer_phone"),
                rs.getString("customer_city")
            )
        ),
        auth.tenantId()
    );
  }

  @Transactional
  public LeadView createLead(AuthUser auth, LeadRequest request) {
    Long dealershipId = getDefaultDealershipId(auth.tenantId());

    // Upsert customer by phone within tenant
    Long customerId = jdbcTemplate.query(
        "SELECT id FROM customers WHERE tenant_id = ? AND phone = ?",
        rs -> rs.next() ? rs.getLong("id") : null,
        auth.tenantId(), request.customerPhone()
    );

    if (customerId == null) {
      jdbcTemplate.update(
          "INSERT INTO customers (tenant_id, dealership_id, name, phone, city, budget_min, budget_max) VALUES (?, ?, ?, ?, ?, ?, ?)",
          auth.tenantId(), dealershipId,
          request.customerName(), request.customerPhone(), request.customerCity(),
          request.budgetMin() != null ? request.budgetMin() : 0,
          request.budgetMax() != null ? request.budgetMax() : 0
      );
      customerId = jdbcTemplate.queryForObject("SELECT MAX(id) FROM customers", Long.class);
    }

    jdbcTemplate.update(
        "INSERT INTO leads (tenant_id, dealership_id, customer_id, source, interest, status, expected_price) VALUES (?, ?, ?, ?, ?, ?, ?)",
        auth.tenantId(), dealershipId, customerId,
        request.source(), request.interest(),
        request.status() != null ? request.status() : "NEW",
        request.expectedPrice() != null ? request.expectedPrice() : 0
    );

    Long leadId = jdbcTemplate.queryForObject("SELECT MAX(id) FROM leads", Long.class);
    if (request.followUpTitle() != null && !request.followUpTitle().isBlank() && request.dueAt() != null) {
      jdbcTemplate.update(
          "INSERT INTO follow_ups (tenant_id, dealership_id, customer_id, lead_id, title, due_at, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          auth.tenantId(),
          dealershipId,
          customerId,
          leadId,
          request.followUpTitle().trim(),
          request.dueAt(),
          blankToNull(request.notes()),
          "PENDING"
      );
    }
    return getLeadById(auth.tenantId(), leadId);
  }

  @Transactional
  public LeadView updateLead(AuthUser auth, Long leadId, LeadRequest request) {
    Long customerId = jdbcTemplate.query(
        "SELECT customer_id FROM leads WHERE id = ? AND tenant_id = ?",
        rs -> rs.next() ? rs.getLong("customer_id") : null,
        leadId, auth.tenantId()
    );
    if (customerId == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Lead not found.");
    }

    jdbcTemplate.update(
        """
        UPDATE customers
        SET name = ?, phone = ?, city = ?, budget_min = ?, budget_max = ?
        WHERE id = ? AND tenant_id = ?
        """,
        request.customerName(),
        request.customerPhone(),
        request.customerCity(),
        request.budgetMin(),
        request.budgetMax(),
        customerId,
        auth.tenantId()
    );

    int updated = jdbcTemplate.update(
        "UPDATE leads SET source = ?, interest = ?, status = ?, expected_price = ? WHERE id = ? AND tenant_id = ?",
        request.source(), request.interest(),
        request.status(), request.expectedPrice() != null ? request.expectedPrice() : 0,
        leadId, auth.tenantId()
    );

    if (request.followUpTitle() != null && !request.followUpTitle().isBlank() && request.dueAt() != null) {
      int followUpUpdated = jdbcTemplate.update(
          """
          UPDATE follow_ups
          SET title = ?, due_at = ?, notes = ?
          WHERE lead_id = ? AND tenant_id = ?
          """,
          request.followUpTitle().trim(),
          request.dueAt(),
          blankToNull(request.notes()),
          leadId,
          auth.tenantId()
      );

      if (followUpUpdated == 0) {
        Long dealershipId = getDefaultDealershipId(auth.tenantId());
        jdbcTemplate.update(
            "INSERT INTO follow_ups (tenant_id, dealership_id, customer_id, lead_id, title, due_at, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            auth.tenantId(),
            dealershipId,
            customerId,
            leadId,
            request.followUpTitle().trim(),
            request.dueAt(),
            blankToNull(request.notes()),
            "PENDING"
        );
      }
    }

    if (updated == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Lead not found.");
    }
    return getLeadById(auth.tenantId(), leadId);
  }

  @Transactional
  public void deleteLead(AuthUser auth, Long leadId) {
    Integer hasBooking = jdbcTemplate.query(
        "SELECT 1 FROM bookings WHERE tenant_id = ? AND lead_id = ?",
        rs -> rs.next() ? 1 : null,
        auth.tenantId(),
        leadId
    );
    if (hasBooking != null) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "This lead already has a booking. Remove the booking first before deleting the lead."
      );
    }

    jdbcTemplate.update(
        "DELETE FROM follow_ups WHERE lead_id = ? AND tenant_id = ?",
        leadId,
        auth.tenantId()
    );

    int deleted = jdbcTemplate.update(
        "DELETE FROM leads WHERE id = ? AND tenant_id = ?",
        leadId, auth.tenantId()
    );
    if (deleted == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Lead not found.");
    }
  }

  private LeadView getLeadById(Long tenantId, Long leadId) {
    return jdbcTemplate.query(
        """
        SELECT l.id, l.source, l.interest, l.status, l.expected_price, l.created_at,
               c.id AS customer_id, c.name AS customer_name, c.phone AS customer_phone, c.city AS customer_city,
               c.budget_min, c.budget_max,
               f.title AS follow_up_title, f.due_at AS follow_up_due_at, f.notes AS follow_up_notes
        FROM leads l
        INNER JOIN customers c ON c.id = l.customer_id
        LEFT JOIN LATERAL (
          SELECT fu.title, fu.due_at, fu.notes
          FROM follow_ups fu
          WHERE fu.tenant_id = l.tenant_id AND fu.lead_id = l.id
          ORDER BY fu.due_at ASC NULLS LAST, fu.id DESC
          LIMIT 1
        ) f ON TRUE
        WHERE l.tenant_id = ? AND l.id = ?
        """,
        rs -> rs.next() ? new LeadView(
            rs.getLong("id"),
            rs.getString("source"),
            rs.getString("interest"),
            rs.getString("status"),
            rs.getInt("expected_price"),
            rs.getObject("created_at", LocalDateTime.class),
            getNullableInteger(rs, "budget_min"),
            getNullableInteger(rs, "budget_max"),
            rs.getString("follow_up_title"),
            rs.getObject("follow_up_due_at", LocalDateTime.class),
            rs.getString("follow_up_notes"),
            new CustomerSummary(
                rs.getLong("customer_id"),
                rs.getString("customer_name"),
                rs.getString("customer_phone"),
                rs.getString("customer_city")
            )
        ) : null,
        tenantId, leadId
    );
  }

  // -------------------------------------------------------------------------
  // Vehicles
  // -------------------------------------------------------------------------

  public List<VehicleView> getVehicles(AuthUser auth) {
    return jdbcTemplate.query(
        """
        SELECT id, stock_code, title, make_name, model_name, vehicle_year,
               fuel, transmission, mileage_km, price, purchase_price, color, status, created_at
        FROM vehicles
        WHERE tenant_id = ?
        ORDER BY created_at DESC
        """,
        (rs, i) -> new VehicleView(
            rs.getLong("id"),
            rs.getString("stock_code"),
            rs.getString("title"),
            rs.getString("make_name"),
            rs.getString("model_name"),
            rs.getInt("vehicle_year"),
            rs.getString("fuel"),
            rs.getString("transmission"),
            rs.getInt("mileage_km"),
            rs.getInt("price"),
            rs.getInt("purchase_price"),
            rs.getString("color"),
            rs.getString("status"),
            rs.getObject("created_at", LocalDateTime.class)
        ),
        auth.tenantId()
    );
  }

  @Transactional
  public VehicleView createVehicle(AuthUser auth, VehicleRequest request) {
    Long dealershipId = getDefaultDealershipId(auth.tenantId());

    jdbcTemplate.update(
        """
        INSERT INTO vehicles (
          tenant_id, dealership_id, stock_code, title, make_name, model_name, vehicle_year,
          fuel, transmission, mileage_km, price, purchase_price, color, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        auth.tenantId(), dealershipId,
        request.stockCode(), request.title(), request.makeName(), request.modelName(),
        request.vehicleYear(), request.fuel(), request.transmission(),
        request.mileageKm() != null ? request.mileageKm() : 0,
        request.price(), request.purchasePrice() != null ? request.purchasePrice() : 0,
        request.color(),
        request.status() != null ? request.status() : "AVAILABLE"
    );

    Long vehicleId = jdbcTemplate.queryForObject("SELECT MAX(id) FROM vehicles", Long.class);
    return getVehicleById(auth.tenantId(), vehicleId);
  }

  @Transactional
  public VehicleView updateVehicle(AuthUser auth, Long vehicleId, VehicleRequest request) {
    int updated = jdbcTemplate.update(
        """
        UPDATE vehicles SET
          stock_code = ?, title = ?, make_name = ?, model_name = ?, vehicle_year = ?,
          fuel = ?, transmission = ?, mileage_km = ?, price = ?, purchase_price = ?,
          color = ?, status = ?
        WHERE id = ? AND tenant_id = ?
        """,
        request.stockCode(), request.title(), request.makeName(), request.modelName(),
        request.vehicleYear(), request.fuel(), request.transmission(),
        request.mileageKm(), request.price(), request.purchasePrice(),
        request.color(), request.status(),
        vehicleId, auth.tenantId()
    );
    if (updated == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehicle not found.");
    }
    return getVehicleById(auth.tenantId(), vehicleId);
  }

  @Transactional
  public void deleteVehicle(AuthUser auth, Long vehicleId) {
    int deleted = jdbcTemplate.update(
        "DELETE FROM vehicles WHERE id = ? AND tenant_id = ?",
        vehicleId, auth.tenantId()
    );
    if (deleted == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehicle not found.");
    }
  }

  private VehicleView getVehicleById(Long tenantId, Long vehicleId) {
    return jdbcTemplate.query(
        """
        SELECT id, stock_code, title, make_name, model_name, vehicle_year,
               fuel, transmission, mileage_km, price, purchase_price, color, status, created_at
        FROM vehicles WHERE tenant_id = ? AND id = ?
        """,
        rs -> rs.next() ? new VehicleView(
            rs.getLong("id"),
            rs.getString("stock_code"),
            rs.getString("title"),
            rs.getString("make_name"),
            rs.getString("model_name"),
            rs.getInt("vehicle_year"),
            rs.getString("fuel"),
            rs.getString("transmission"),
            rs.getInt("mileage_km"),
            rs.getInt("price"),
            rs.getInt("purchase_price"),
            rs.getString("color"),
            rs.getString("status"),
            rs.getObject("created_at", LocalDateTime.class)
        ) : null,
        tenantId, vehicleId
    );
  }

  // -------------------------------------------------------------------------
  // Follow-ups
  // -------------------------------------------------------------------------

  public List<FollowUpView> getFollowUps(AuthUser auth) {
    return jdbcTemplate.query(
        """
        SELECT f.id, f.title, f.due_at, f.notes, f.status,
               c.id AS customer_id, c.name AS customer_name,
               l.id AS lead_id, l.interest AS lead_interest
        FROM follow_ups f
        INNER JOIN customers c ON c.id = f.customer_id
        LEFT  JOIN leads l ON l.id = f.lead_id
        WHERE f.tenant_id = ?
        ORDER BY f.due_at ASC
        """,
        (rs, i) -> new FollowUpView(
            rs.getLong("id"),
            rs.getString("title"),
            rs.getObject("due_at", LocalDateTime.class),
            rs.getString("notes"),
            rs.getString("status"),
            new CustomerSummary(
                rs.getLong("customer_id"),
                rs.getString("customer_name"),
                null, null
            ),
            rs.getObject("lead_id") != null
                ? new LeadSummary(rs.getLong("lead_id"), rs.getString("lead_interest"))
                : null
        ),
        auth.tenantId()
    );
  }

  // -------------------------------------------------------------------------
  // Bookings
  // -------------------------------------------------------------------------

  public List<BookingView> getBookings(AuthUser auth) {
    return jdbcTemplate.query(
        """
        SELECT b.id, b.amount, b.payment_mode, b.delivery_date, b.created_at, b.lead_id, b.final_price,
               c.id AS customer_id, c.name AS customer_name, c.phone AS customer_phone,
               v.id AS vehicle_id, v.title AS vehicle_title, v.stock_code,
               l.interest AS lead_interest
        FROM bookings b
        INNER JOIN customers c ON c.id = b.customer_id
        INNER JOIN vehicles  v ON v.id = b.vehicle_id
        LEFT JOIN leads l ON l.id = b.lead_id
        WHERE b.tenant_id = ?
        ORDER BY b.created_at DESC
        """,
        (rs, i) -> new BookingView(
            rs.getLong("id"),
            rs.getInt("amount"),
            rs.getString("payment_mode"),
            rs.getObject("delivery_date", LocalDate.class),
            rs.getObject("created_at", LocalDateTime.class),
            new CustomerSummary(
                rs.getLong("customer_id"),
                rs.getString("customer_name"),
                rs.getString("customer_phone"),
                null
            ),
            new VehicleSummary(
                rs.getLong("vehicle_id"),
                rs.getString("vehicle_title"),
                rs.getString("stock_code")
            ),
            rs.getObject("lead_id") != null
                ? new LeadSummary(rs.getLong("lead_id"), rs.getString("lead_interest"))
                : null,
            rs.getObject("final_price") != null ? rs.getInt("final_price") : null
        ),
        auth.tenantId()
    );
  }

  @Transactional
  public BookingView createBooking(AuthUser auth, BookingRequest request) {
    Long dealershipId = getDefaultDealershipId(auth.tenantId());

    LeadRow lead = jdbcTemplate.query(
        """
        SELECT l.id, l.customer_id, l.interest, l.status
        FROM leads l
        WHERE l.id = ? AND l.tenant_id = ?
        """,
        rs -> rs.next() ? new LeadRow(
            rs.getLong("id"),
            rs.getLong("customer_id"),
            rs.getString("interest"),
            rs.getString("status")
        ) : null,
        request.leadId(),
        auth.tenantId()
    );

    if (lead == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Lead not found.");
    }

    if ("WON".equals(lead.status())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This lead already has a booking.");
    }

    VehicleSummary vehicle = jdbcTemplate.query(
        """
        SELECT id, title, stock_code
        FROM vehicles
        WHERE id = ? AND tenant_id = ?
        """,
        rs -> rs.next() ? new VehicleSummary(
            rs.getLong("id"),
            rs.getString("title"),
            rs.getString("stock_code")
        ) : null,
        request.vehicleId(),
        auth.tenantId()
    );

    if (vehicle == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehicle not found.");
    }

    Integer existingBooking = jdbcTemplate.query(
        "SELECT 1 FROM bookings WHERE tenant_id = ? AND lead_id = ?",
        rs -> rs.next() ? 1 : null,
        auth.tenantId(),
        request.leadId()
    );
    if (existingBooking != null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A booking already exists for this lead.");
    }

    jdbcTemplate.update(
        """
        INSERT INTO bookings (
          tenant_id, dealership_id, customer_id, vehicle_id, lead_id, amount, payment_mode, delivery_date, booking_price, final_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        auth.tenantId(),
        dealershipId,
        lead.customerId(),
        request.vehicleId(),
        request.leadId(),
        request.amount(),
        request.paymentMode(),
        request.deliveryDate(),
        request.amount(),
        request.finalPrice() != null ? request.finalPrice() : request.amount()
    );

    jdbcTemplate.update(
        """
        UPDATE leads
        SET status = 'WON', is_active = FALSE, closed_at = CURRENT_TIMESTAMP
        WHERE id = ? AND tenant_id = ?
        """,
        request.leadId(),
        auth.tenantId()
    );

    jdbcTemplate.update(
        "UPDATE vehicles SET status = 'RESERVED' WHERE id = ? AND tenant_id = ?",
        request.vehicleId(),
        auth.tenantId()
    );

    Long bookingId = jdbcTemplate.queryForObject("SELECT MAX(id) FROM bookings", Long.class);
    return getBookingById(auth.tenantId(), bookingId);
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private int count(String sql, Object... args) {
    Integer result = jdbcTemplate.queryForObject(sql, Integer.class, args);
    return result != null ? result : 0;
  }

  private Integer getNullableInteger(java.sql.ResultSet rs, String columnLabel) throws java.sql.SQLException {
    int value = rs.getInt(columnLabel);
    return rs.wasNull() ? null : value;
  }

  private Long getDefaultDealershipId(Long tenantId) {
    Long id = jdbcTemplate.query(
        "SELECT id FROM dealerships WHERE tenant_id = ? ORDER BY id ASC LIMIT 1",
        rs -> rs.next() ? rs.getLong("id") : null,
        tenantId
    );
    if (id == null) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No dealership found for tenant.");
    }
    return id;
  }

  private BookingView getBookingById(Long tenantId, Long bookingId) {
    return jdbcTemplate.query(
        """
        SELECT b.id, b.amount, b.payment_mode, b.delivery_date, b.created_at, b.lead_id, b.final_price,
               c.id AS customer_id, c.name AS customer_name, c.phone AS customer_phone,
               v.id AS vehicle_id, v.title AS vehicle_title, v.stock_code,
               l.interest AS lead_interest
        FROM bookings b
        INNER JOIN customers c ON c.id = b.customer_id
        INNER JOIN vehicles v ON v.id = b.vehicle_id
        LEFT JOIN leads l ON l.id = b.lead_id
        WHERE b.tenant_id = ? AND b.id = ?
        """,
        rs -> rs.next() ? new BookingView(
            rs.getLong("id"),
            rs.getInt("amount"),
            rs.getString("payment_mode"),
            rs.getObject("delivery_date", LocalDate.class),
            rs.getObject("created_at", LocalDateTime.class),
            new CustomerSummary(
                rs.getLong("customer_id"),
                rs.getString("customer_name"),
                rs.getString("customer_phone"),
                null
            ),
            new VehicleSummary(
                rs.getLong("vehicle_id"),
                rs.getString("vehicle_title"),
                rs.getString("stock_code")
            ),
            rs.getObject("lead_id") != null
                ? new LeadSummary(rs.getLong("lead_id"), rs.getString("lead_interest"))
                : null,
            rs.getObject("final_price") != null ? rs.getInt("final_price") : null
        ) : null,
        tenantId,
        bookingId
    );
  }

  private String blankToNull(String value) {
    if (value == null) {
      return null;
    }
    String trimmed = value.trim();
    return trimmed.isEmpty() ? null : trimmed;
  }

  // -------------------------------------------------------------------------
  // DTOs
  // -------------------------------------------------------------------------

  public record SnapshotResponse(
      int totalLeads,
      int openLeads,
      int availableVehicles,
      int pendingFollowUps,
      int totalBookings
  ) {}

  public record LeadRequest(
      @NotBlank(message = "Customer name is required.") String customerName,
      @NotBlank(message = "Customer phone is required.")
      @Pattern(regexp = "\\d{10}", message = "Customer phone must be exactly 10 digits.")
      String customerPhone,
      String customerCity,
      Integer budgetMin,
      Integer budgetMax,
      String source,
      @NotBlank(message = "Interest is required.") String interest,
      String status,
      Integer expectedPrice,
      String followUpTitle,
      LocalDateTime dueAt,
      String notes
  ) {}

  public record LeadView(
      Long id,
      String source,
      String interest,
      String status,
      int expectedPrice,
      LocalDateTime createdAt,
      Integer budgetMin,
      Integer budgetMax,
      String followUpTitle,
      LocalDateTime dueAt,
      String notes,
      CustomerSummary customer
  ) {}

  public record VehicleRequest(
      @NotBlank(message = "Stock code is required.") String stockCode,
      @NotBlank(message = "Title is required.") String title,
      @NotBlank(message = "Make is required.") String makeName,
      @NotBlank(message = "Model is required.") String modelName,
      @NotNull(message = "Year is required.") Integer vehicleYear,
      String fuel,
      String transmission,
      Integer mileageKm,
      @NotNull(message = "Price is required.") @Positive Integer price,
      Integer purchasePrice,
      String color,
      String status
  ) {}

  public record VehicleView(
      Long id,
      String stockCode,
      String title,
      String makeName,
      String modelName,
      int vehicleYear,
      String fuel,
      String transmission,
      int mileageKm,
      int price,
      int purchasePrice,
      String color,
      String status,
      LocalDateTime createdAt
  ) {}

  public record FollowUpView(
      Long id,
      String title,
      LocalDateTime dueAt,
      String notes,
      String status,
      CustomerSummary customer,
      LeadSummary lead
  ) {}

  public record BookingView(
      Long id,
      int amount,
      String paymentMode,
      LocalDate deliveryDate,
      LocalDateTime createdAt,
      CustomerSummary customer,
      VehicleSummary vehicle,
      LeadSummary lead,
      Integer finalPrice
  ) {}

  public record BookingRequest(
      @NotNull(message = "Lead is required.") Long leadId,
      @NotNull(message = "Vehicle is required.") Long vehicleId,
      @NotNull(message = "Booking amount is required.") @Positive Integer amount,
      @NotBlank(message = "Payment mode is required.") String paymentMode,
      LocalDate deliveryDate,
      Integer finalPrice
  ) {}

  public record CustomerSummary(Long id, String name, String phone, String city) {}
  public record LeadSummary(Long id, String interest) {}
  public record VehicleSummary(Long id, String title, String stockCode) {}
  private record LeadRow(Long id, Long customerId, String interest, String status) {}
}
