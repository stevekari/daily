package com.steve.budget.service;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LoginAttemptService {

    public static final int MAX_ATTEMPTS = 5;
    public static final long LOCK_TIME_DURATION_MS = 15 * 60 * 1000; // 15 minutes

    private static class AttemptRecord {
        int attempts;
        long lastAttemptTime;
        long lockedUntil;

        AttemptRecord(int attempts, long lastAttemptTime, long lockedUntil) {
            this.attempts = attempts;
            this.lastAttemptTime = lastAttemptTime;
            this.lockedUntil = lockedUntil;
        }
    }

    private final Map<String, AttemptRecord> attemptsCache = new ConcurrentHashMap<>();

    public void loginSucceeded(String key) {
        if (key != null) {
            attemptsCache.remove(key.toLowerCase().trim());
        }
    }

    public void loginFailed(String key) {
        if (key == null) return;
        String normalizedKey = key.toLowerCase().trim();
        long now = System.currentTimeMillis();

        attemptsCache.compute(normalizedKey, (k, record) -> {
            if (record == null || (now - record.lastAttemptTime > LOCK_TIME_DURATION_MS && record.lockedUntil < now)) {
                return new AttemptRecord(1, now, 0);
            }
            int newAttempts = record.attempts + 1;
            long lockedUntil = record.lockedUntil;
            if (newAttempts >= MAX_ATTEMPTS) {
                lockedUntil = now + LOCK_TIME_DURATION_MS;
            }
            return new AttemptRecord(newAttempts, now, lockedUntil);
        });
    }

    public boolean isBlocked(String key) {
        if (key == null) return false;
        String normalizedKey = key.toLowerCase().trim();
        AttemptRecord record = attemptsCache.get(normalizedKey);
        if (record == null) return false;

        long now = System.currentTimeMillis();
        if (record.lockedUntil > now) {
            return true;
        }
        // If lockout expired, clean up
        if (record.lockedUntil > 0 && record.lockedUntil <= now) {
            attemptsCache.remove(normalizedKey);
            return false;
        }
        return false;
    }

    public long getRemainingLockoutMinutes(String key) {
        if (key == null) return 0;
        String normalizedKey = key.toLowerCase().trim();
        AttemptRecord record = attemptsCache.get(normalizedKey);
        if (record == null || record.lockedUntil <= System.currentTimeMillis()) {
            return 0;
        }
        long diff = record.lockedUntil - System.currentTimeMillis();
        return Math.max(1, (diff + 59999) / 60000);
    }

    public int getRemainingAttempts(String key) {
        if (key == null) return MAX_ATTEMPTS;
        String normalizedKey = key.toLowerCase().trim();
        AttemptRecord record = attemptsCache.get(normalizedKey);
        if (record == null) return MAX_ATTEMPTS;
        return Math.max(0, MAX_ATTEMPTS - record.attempts);
    }
}

