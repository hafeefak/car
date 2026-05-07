package com.carsync.backend.controller;

import com.carsync.backend.security.AuthUser;
import com.carsync.backend.service.AuthService;
import com.carsync.backend.service.AuthService.AuthResponse;
import com.carsync.backend.service.AuthService.LoginRequest;
import com.carsync.backend.service.AuthService.RegisterRequest;
import com.carsync.backend.service.AuthService.UserView;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/register")
  public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
    return ResponseEntity.ok(authService.register(request));
  }

  @PostMapping("/login")
  public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
    return ResponseEntity.ok(authService.login(request));
  }

  @GetMapping("/me")
  public ResponseEntity<UserView> me(Authentication authentication) {
    AuthUser authUser = (AuthUser) authentication.getPrincipal();
    return ResponseEntity.ok(authService.currentUser(authUser));
  }
}
