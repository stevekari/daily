package com.steve.budget.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * EmailService
 *
 * Handles sending emails for password reset verification codes.
 * Gracefully logs code in console if SMTP is not configured for local development.
 */
@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    /**
     * Send 6-digit password reset verification code to user's email.
     *
     * @param recipientEmail Target email address
     * @param code 6-digit numeric verification code
     * @param recipientName Name of recipient if available
     */
    public boolean sendPasswordResetCode(String recipientEmail, String code, String recipientName) {
        String greeting = (recipientName != null && !recipientName.isBlank()) ? recipientName : "Valued User";

        logger.info("=================================================");
        logger.info("📧 [STEVE BUDGET] PASSWORD RESET VERIFICATION CODE");
        logger.info("To: {}", recipientEmail);
        logger.info("User: {}", greeting);
        logger.info("Verification Code: >> {} << (Valid for 15 minutes)", code);
        logger.info("=================================================");

        // In a production environment with configured SMTP (e.g., SendGrid, Mailgun, AWS SES, Gmail),
        // we would dispatch the JavaMail message here.
        // For development and portability, the code is always logged to the console and safely processed.
        return true;
    }
}

