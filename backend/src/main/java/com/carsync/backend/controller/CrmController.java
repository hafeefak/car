package com.carsync.backend.controller;

import com.carsync.backend.security.AuthUser;
import com.carsync.backend.service.CrmService;
import com.carsync.backend.service.CrmService.BookingRequest;
import com.carsync.backend.service.CrmService.BookingView;
import com.carsync.backend.service.CrmService.FollowUpView;
import com.carsync.backend.service.CrmService.LeadRequest;
import com.carsync.backend.service.CrmService.LeadView;
import com.carsync.backend.service.CrmService.SnapshotResponse;
import com.carsync.backend.service.CrmService.VehicleRequest;
import com.carsync.backend.service.CrmService.VehicleView;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class CrmController {
  private final CrmService crmService;

  public CrmController(CrmService crmService) {
    this.crmService = crmService;
  }

  @GetMapping("/crm/snapshot")
  public ResponseEntity<SnapshotResponse> snapshot(Authentication authentication) {
    return ResponseEntity.ok(crmService.getSnapshot(auth(authentication)));
  }

  @GetMapping("/leads")
  public ResponseEntity<List<LeadView>> leads(Authentication authentication) {
    return ResponseEntity.ok(crmService.getLeads(auth(authentication)));
  }

  @PostMapping("/leads")
  public ResponseEntity<LeadView> createLead(Authentication authentication, @Valid @RequestBody LeadRequest request) {
    return ResponseEntity.ok(crmService.createLead(auth(authentication), request));
  }

  @PutMapping("/leads/{leadId}")
  public ResponseEntity<LeadView> updateLead(Authentication authentication, @PathVariable Long leadId, @Valid @RequestBody LeadRequest request) {
    return ResponseEntity.ok(crmService.updateLead(auth(authentication), leadId, request));
  }

  @DeleteMapping("/leads/{leadId}")
  public ResponseEntity<Void> deleteLead(Authentication authentication, @PathVariable Long leadId) {
    crmService.deleteLead(auth(authentication), leadId);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/vehicles")
  public ResponseEntity<List<VehicleView>> vehicles(Authentication authentication) {
    return ResponseEntity.ok(crmService.getVehicles(auth(authentication)));
  }

  @PostMapping("/vehicles")
  public ResponseEntity<VehicleView> createVehicle(Authentication authentication, @Valid @RequestBody VehicleRequest request) {
    return ResponseEntity.ok(crmService.createVehicle(auth(authentication), request));
  }

  @PutMapping("/vehicles/{vehicleId}")
  public ResponseEntity<VehicleView> updateVehicle(Authentication authentication, @PathVariable Long vehicleId, @Valid @RequestBody VehicleRequest request) {
    return ResponseEntity.ok(crmService.updateVehicle(auth(authentication), vehicleId, request));
  }

  @DeleteMapping("/vehicles/{vehicleId}")
  public ResponseEntity<Void> deleteVehicle(Authentication authentication, @PathVariable Long vehicleId) {
    crmService.deleteVehicle(auth(authentication), vehicleId);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/follow-ups")
  public ResponseEntity<List<FollowUpView>> followUps(Authentication authentication) {
    return ResponseEntity.ok(crmService.getFollowUps(auth(authentication)));
  }

  @GetMapping("/bookings")
  public ResponseEntity<List<BookingView>> bookings(Authentication authentication) {
    return ResponseEntity.ok(crmService.getBookings(auth(authentication)));
  }

  @PostMapping("/bookings")
  public ResponseEntity<BookingView> createBooking(Authentication authentication, @Valid @RequestBody BookingRequest request) {
    return ResponseEntity.ok(crmService.createBooking(auth(authentication), request));
  }

  private AuthUser auth(Authentication authentication) {
    return (AuthUser) authentication.getPrincipal();
  }
}
