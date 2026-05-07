package com.carsync.backend.service;

import com.carsync.backend.security.AuthUser;
import com.carsync.backend.security.JwtService;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
  private final JdbcTemplate jdbcTemplate;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;

  public AuthService(JdbcTemplate jdbcTemplate, PasswordEncoder passwordEncoder, JwtService jwtService) {
    this.jdbcTemplate = jdbcTemplate;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
  }

  @Transactional
  public AuthResponse register(RegisterRequest request) {
    Long tenantExists = jdbcTemplate.query(
        "SELECT id FROM tenants WHERE slug = ?",
        rs -> rs.next() ? rs.getLong("id") : null,
        slugify(request.dealershipName())
    );
    if (tenantExists != null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A dealership with that name already exists.");
    }

    jdbcTemplate.update(
        "INSERT INTO tenants (name, city, slug) VALUES (?, ?, ?)",
        request.dealershipName().trim(),
        normalize(request.city()),
        slugify(request.dealershipName())
    );
    Long tenantId = jdbcTemplate.queryForObject("SELECT MAX(id) FROM tenants", Long.class);

    jdbcTemplate.update(
        "INSERT INTO dealerships (tenant_id, name, city) VALUES (?, ?, ?)",
        tenantId,
        request.dealershipName().trim(),
        normalize(request.city())
    );

    Long emailExists = jdbcTemplate.query(
        "SELECT id FROM users WHERE tenant_id = ? AND email = ?",
        rs -> rs.next() ? rs.getLong("id") : null,
        tenantId,
        request.email().trim().toLowerCase()
    );
    if (emailExists != null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A user with that email already exists.");
    }

    jdbcTemplate.update(
        "INSERT INTO users (tenant_id, name, email, password_hash) VALUES (?, ?, ?, ?)",
        tenantId,
        request.name().trim(),
        request.email().trim().toLowerCase(),
        passwordEncoder.encode(request.password())
    );

    Long userId = jdbcTemplate.queryForObject("SELECT MAX(id) FROM users", Long.class);
    AuthUser authUser = new AuthUser(userId, tenantId, request.name().trim(), request.email().trim().toLowerCase());
    return new AuthResponse(token(authUser), new UserView(authUser.userId(), authUser.tenantId(), authUser.name(), authUser.email(), request.dealershipName().trim()));
  }

  public AuthResponse login(LoginRequest request) {
    UserRow row = jdbcTemplate.query(
        """
        SELECT u.id, u.tenant_id, u.name, u.email, u.password_hash, d.name AS dealership_name
        FROM users u
        INNER JOIN dealerships d ON d.tenant_id = u.tenant_id
        WHERE u.email = ?
        ORDER BY d.id ASC
        LIMIT 1
        """,
        rs -> rs.next() ? new UserRow(
            rs.getLong("id"),
            rs.getLong("tenant_id"),
            rs.getString("name"),
            rs.getString("email"),
            rs.getString("password_hash"),
            rs.getString("dealership_name")
        ) : null,
        request.email().trim().toLowerCase()
    );

    if (row == null || !passwordEncoder.matches(request.password(), row.passwordHash())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
    }

    AuthUser authUser = new AuthUser(row.id(), row.tenantId(), row.name(), row.email());
    return new AuthResponse(token(authUser), new UserView(row.id(), row.tenantId(), row.name(), row.email(), row.dealershipName()));
  }

  public UserView currentUser(AuthUser authUser) {
    return jdbcTemplate.query(
        """
        SELECT u.id, u.tenant_id, u.name, u.email, d.name AS dealership_name
        FROM users u
        INNER JOIN dealerships d ON d.tenant_id = u.tenant_id
        WHERE u.id = ?
        ORDER BY d.id ASC
        LIMIT 1
        """,
        rs -> rs.next() ? new UserView(
            rs.getLong("id"),
            rs.getLong("tenant_id"),
            rs.getString("name"),
            rs.getString("email"),
            rs.getString("dealership_name")
        ) : null,
        authUser.userId()
    );
  }

  private String token(AuthUser authUser) {
    return jwtService.generateToken(authUser);
  }

  private String normalize(String value) {
    if (value == null) {
      return null;
    }
    String trimmed = value.trim();
    return trimmed.isEmpty() ? null : trimmed;
  }

  private String slugify(String value) {
    return value.trim().toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
  }

  public record RegisterRequest(
      @NotBlank(message = "Name is required.") String name,
      @Email(message = "Valid email is required.") @NotBlank(message = "Email is required.") String email,
      @NotBlank(message = "Password is required.") String password,
      @NotBlank(message = "Dealership name is required.") String dealershipName,
      String city
  ) {
  }

  public record LoginRequest(
      @Email(message = "Valid email is required.") @NotBlank(message = "Email is required.") String email,
      @NotBlank(message = "Password is required.") String password
  ) {
  }

  public record AuthResponse(String token, UserView user) {
  }

  public record UserView(Long id, Long tenantId, String name, String email, String dealershipName) {
  }

  private record UserRow(Long id, Long tenantId, String name, String email, String passwordHash, String dealershipName) {
  }
}
