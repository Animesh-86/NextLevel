package com.nextlevel.api.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService("VGVzdFNlY3JldEtleU9mVGhpcnR5VHdvQnl0ZXNGb3JKV1QxMjM0NTY3ODkwMTIzNDU2", 3600000L);
    }

    @Test
    void testGenerateAndParseToken() {
        String token = jwtService.generateToken("user123", "test@example.com", "USER");
        assertNotNull(token);

        JwtClaims claims = jwtService.parseClaims(token);
        assertEquals("user123", claims.getUserId());
        assertEquals("test@example.com", claims.getEmail());
        assertEquals("USER", claims.getRole());
    }

    @Test
    void testExpiredToken() {
        JwtService shortLivedService = new JwtService("VGVzdFNlY3JldEtleU9mVGhpcnR5VHdvQnl0ZXNGb3JKV1QxMjM0NTY3ODkwMTIzNDU2", -1000L);
        String token = shortLivedService.generateToken("user123", "test@example.com", "USER");

        assertThrows(ExpiredJwtException.class, () -> shortLivedService.parseClaims(token));
    }

    @Test
    void testInvalidToken() {
        assertThrows(MalformedJwtException.class, () -> jwtService.parseClaims("invalid.token.here"));
    }
}
