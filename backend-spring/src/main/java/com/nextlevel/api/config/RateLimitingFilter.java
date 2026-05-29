package com.nextlevel.api.config;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Rate limiting filter for authentication endpoints to prevent brute-force attacks.
 * Uses Bucket4j token bucket algorithm: 10 requests per minute per IP on auth endpoints.
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    private static final int AUTH_REQUESTS_PER_MINUTE = 10;
    private static final int GENERAL_REQUESTS_PER_MINUTE = 100;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        String ip = resolveClientIp(request);

        boolean isAuthEndpoint = path.startsWith("/api/auth/login") || path.startsWith("/api/auth/register");
        String bucketKey = isAuthEndpoint ? "auth:" + ip : "general:" + ip;
        int limit = isAuthEndpoint ? AUTH_REQUESTS_PER_MINUTE : GENERAL_REQUESTS_PER_MINUTE;

        Bucket bucket = buckets.computeIfAbsent(bucketKey, k -> createBucket(limit));

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"success\":false,\"message\":\"Too many requests. Please try again later.\"}");
        }

        // Periodic cleanup: prevent memory leak from abandoned IPs
        if (buckets.size() > 10_000) {
            buckets.clear();
        }
    }

    private Bucket createBucket(int requestsPerMinute) {
        Bandwidth limit = Bandwidth.builder()
                .capacity(requestsPerMinute)
                .refillGreedy(requestsPerMinute, Duration.ofMinutes(1))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    private String resolveClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
