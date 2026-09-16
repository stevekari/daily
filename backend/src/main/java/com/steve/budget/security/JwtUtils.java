package com.steve.budget.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtils {

    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

    @Value("${app.jwt.secret:}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms:604800000}")
    private long jwtExpirationMs;

    @Value("${spring.profiles.active:default}")
    private String activeProfile;

    private SecretKey cachedSigningKey;

    private synchronized SecretKey getSigningKey() {
        if (cachedSigningKey != null) {
            return cachedSigningKey;
        }

        if (jwtSecret != null && !jwtSecret.isBlank()) {
            byte[] keyBytes;
            try {
                // Try decoding as Base64 first if formatted
                keyBytes = Decoders.BASE64.decode(jwtSecret.trim());
            } catch (Exception e) {
                keyBytes = jwtSecret.trim().getBytes(StandardCharsets.UTF_8);
            }
            if (keyBytes.length < 32) {
                // Pad to 256 bits if user supplied shorter string
                byte[] padded = new byte[32];
                System.arraycopy(keyBytes, 0, padded, 0, Math.min(keyBytes.length, 32));
                keyBytes = padded;
            }
            cachedSigningKey = Keys.hmacShaKeyFor(keyBytes);
        } else {
            if ("prod".equalsIgnoreCase(activeProfile) || "production".equalsIgnoreCase(activeProfile)) {
                throw new IllegalStateException("FATAL: JWT_SECRET environment variable must be set in production mode!");
            }
            logger.warn("⚠️ No JWT_SECRET specified in environment. Generated an in-memory 512-bit signing key for this session. (Set JWT_SECRET in production on Render).");
            cachedSigningKey = Jwts.SIG.HS512.key().build();
        }

        return cachedSigningKey;
    }

    public String generateToken(UserPrincipal userPrincipal) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .subject(userPrincipal.getUsername())
                .claim("userId", userPrincipal.getId())
                .claim("email", userPrincipal.getEmail())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    public String getUsernameFromJwtToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claims.getSubject();
    }

    public Long getUserIdFromJwtToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        Object userIdObj = claims.get("userId");
        if (userIdObj instanceof Number) {
            return ((Number) userIdObj).longValue();
        }
        return null;
    }

    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(authToken);
            return true;
        } catch (ExpiredJwtException e) {
            logger.warn("JWT token is expired: {}", e.getMessage());
        } catch (JwtException e) {
            logger.warn("Invalid JWT token: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.warn("JWT claims string is empty: {}", e.getMessage());
        }
        return false;
    }
}

