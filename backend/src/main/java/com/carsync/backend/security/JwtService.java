package com.carsync.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
  private final Key signingKey;
  private final long expirationDays;

  public JwtService(
      @Value("${carsync.jwt.secret}") String secret,
      @Value("${carsync.jwt.expiration-days}") long expirationDays
  ) {
    byte[] keyBytes = secret.length() >= 32
        ? secret.getBytes(StandardCharsets.UTF_8)
        : Decoders.BASE64.decode("Y2hhbmdlLXRoaXMtc2VjcmV0LWtleS1mb3ItcHJvZHVjdGlvbi0xMjM0NTY=");
    this.signingKey = Keys.hmacShaKeyFor(keyBytes);
    this.expirationDays = expirationDays;
  }

  public String generateToken(AuthUser user) {
    Map<String, Object> claims = new HashMap<>();
    claims.put("tenantId", user.tenantId());
    claims.put("name", user.name());
    claims.put("email", user.email());

    Instant now = Instant.now();
    return Jwts.builder()
        .claims(claims)
        .subject(String.valueOf(user.userId()))
        .issuedAt(Date.from(now))
        .expiration(Date.from(now.plus(expirationDays, ChronoUnit.DAYS)))
        .signWith(signingKey)
        .compact();
  }

  public AuthUser parseToken(String token) {
    Claims claims = Jwts.parser()
        .verifyWith((javax.crypto.SecretKey) signingKey)
        .build()
        .parseSignedClaims(token)
        .getPayload();

    Long userId = Long.parseLong(claims.getSubject());
    Long tenantId = claims.get("tenantId", Long.class);
    String name = claims.get("name", String.class);
    String email = claims.get("email", String.class);

    return new AuthUser(userId, tenantId, name, email);
  }
}
