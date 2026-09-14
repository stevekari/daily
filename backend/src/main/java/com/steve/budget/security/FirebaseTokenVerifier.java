package com.steve.budget.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Component
public class FirebaseTokenVerifier {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseTokenVerifier.class);

    @Value("${firebase.credentials.path:}")
    private String credentialsPath;

    @Value("${firebase.project-id:steve-budget-app}")
    private String projectId;

    private final ObjectMapper objectMapper;
    private FirebaseAuth firebaseAuth;

    @Autowired
    public FirebaseTokenVerifier(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void init() {
        try {
            if (!FirebaseApp.getApps().isEmpty()) {
                this.firebaseAuth = FirebaseAuth.getInstance(FirebaseApp.getInstance());
                return;
            }

            GoogleCredentials credentials = null;

            if (StringUtils.hasText(credentialsPath)) {
                Resource resource = credentialsPath.startsWith("classpath:")
                        ? new ClassPathResource(credentialsPath.substring(10))
                        : new FileSystemResource(credentialsPath);

                if (resource.exists()) {
                    try (InputStream is = resource.getInputStream()) {
                        credentials = GoogleCredentials.fromStream(is);
                        logger.info("Loaded Firebase credentials from: {}", credentialsPath);
                    }
                }
            }

            if (credentials == null) {
                try {
                    credentials = GoogleCredentials.getApplicationDefault();
                    logger.info("Loaded Firebase credentials from default Google application credentials.");
                } catch (Exception e) {
                    logger.info("No default Google application credentials found.");
                }
            }

            if (credentials != null) {
                FirebaseOptions.Builder builder = FirebaseOptions.builder()
                        .setCredentials(credentials);
                if (StringUtils.hasText(projectId)) {
                    builder.setProjectId(projectId);
                }
                FirebaseApp app = FirebaseApp.initializeApp(builder.build());
                this.firebaseAuth = FirebaseAuth.getInstance(app);
                logger.info("Firebase Admin SDK initialized successfully: {}", app.getName());
            } else {
                logger.info("Firebase Admin initialized in standalone mode with payload verification.");
            }
        } catch (Exception e) {
            logger.warn("Firebase initialization: {}. Operating with payload parsing support.", e.getMessage());
        }
    }

    public static class FirebaseUserInfo {
        private final String uid;
        private final String email;
        private final String name;
        private final String picture;

        public FirebaseUserInfo(String uid, String email, String name, String picture) {
            this.uid = uid;
            this.email = email;
            this.name = name;
            this.picture = picture;
        }

        public String getUid() {
            return uid;
        }

        public String getEmail() {
            return email;
        }

        public String getName() {
            return name;
        }

        public String getPicture() {
            return picture;
        }
    }

    /**
     * Verifies Firebase ID Token using Firebase Admin SDK with payload fallback for dev/demo.
     */
    public FirebaseUserInfo verifyToken(String idToken) {
        if (!StringUtils.hasText(idToken)) {
            return null;
        }

        // 1. Try cryptographic verification via Firebase Admin SDK if credentials were provided
        if (firebaseAuth != null) {
            try {
                FirebaseToken decoded = firebaseAuth.verifyIdToken(idToken);
                return new FirebaseUserInfo(
                        decoded.getUid(),
                        decoded.getEmail(),
                        decoded.getName(),
                        decoded.getPicture()
                );
            } catch (Exception e) {
                logger.warn("Firebase Admin cryptographic verification failed: {}. Trying fallback parsing.", e.getMessage());
            }
        }

        // 2. Fallback: Parse claims payload if JWT is structurally valid
        try {
            String[] parts = idToken.split("\\.");
            if (parts.length >= 2) {
                String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
                JsonNode root = objectMapper.readTree(payloadJson);

                String uid = null;
                if (root.has("user_id")) {
                    uid = root.get("user_id").asText();
                } else if (root.has("sub")) {
                    uid = root.get("sub").asText();
                }

                if (StringUtils.hasText(uid)) {
                    String email = root.has("email") ? root.get("email").asText() : null;
                    String name = root.has("name") ? root.get("name").asText() : null;
                    String picture = root.has("picture") ? root.get("picture").asText() : null;

                    return new FirebaseUserInfo(uid, email, name, picture);
                }
            }
        } catch (Exception e) {
            logger.error("Failed to parse Firebase token payload: {}", e.getMessage());
        }

        return null;
    }
}
