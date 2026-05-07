package com.carsync.backend.security;

public record AuthUser(Long userId, Long tenantId, String name, String email) {
}
