package com.steve.budget.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

/**
 * DataSourceConfig
 *
 * Configures production-grade PostgreSQL connectivity with Render DATABASE_URL support,
 * and seamless fallback to H2 in-memory database for zero-setup local development and tests.
 */
@Configuration
public class DataSourceConfig {

    private static final Logger logger = LoggerFactory.getLogger(DataSourceConfig.class);

    @Value("${DATABASE_URL:}")
    private String databaseUrlEnv;

    @Value("${SPRING_DATASOURCE_URL:}")
    private String springDatasourceUrl;

    @Value("${spring.datasource.username:sa}")
    private String defaultUsername;

    @Value("${spring.datasource.password:}")
    private String defaultPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();

        // 1. Check for Render standard DATABASE_URL (postgres://user:pass@host:5432/dbname)
        String rawUrl = !databaseUrlEnv.isBlank() ? databaseUrlEnv.trim() : springDatasourceUrl.trim();

        if (rawUrl.startsWith("postgres://") || rawUrl.startsWith("postgresql://")) {
            try {
                URI dbUri = new URI(rawUrl);
                String userInfo = dbUri.getUserInfo();
                String username = defaultUsername;
                String password = defaultPassword;

                if (userInfo != null && userInfo.contains(":")) {
                    String[] parts = userInfo.split(":", 2);
                    username = parts[0];
                    password = parts[1];
                }

                int port = dbUri.getPort() != -1 ? dbUri.getPort() : 5432;
                String dbPath = dbUri.getPath();
                if (dbPath.startsWith("/")) {
                    dbPath = dbPath.substring(1);
                }

                String jdbcUrl = String.format("jdbc:postgresql://%s:%d/%s", dbUri.getHost(), port, dbPath);
                
                // Add SSL mode if specified or default for cloud databases
                if (dbUri.getQuery() != null && !dbUri.getQuery().isBlank()) {
                    jdbcUrl += "?" + dbUri.getQuery();
                } else if (!dbUri.getHost().equals("localhost") && !dbUri.getHost().equals("127.0.0.1")) {
                    jdbcUrl += "?sslmode=require";
                }

                logger.info("🐘 Initializing PostgreSQL DataSource from DATABASE_URL for host: {}, db: {}", dbUri.getHost(), dbPath);

                config.setJdbcUrl(jdbcUrl);
                config.setUsername(username);
                config.setPassword(password);
                config.setDriverClassName("org.postgresql.Driver");
                config.setMaximumPoolSize(10);
                config.setMinimumIdle(2);
                config.setIdleTimeout(30000);
                config.setConnectionTimeout(20000);
                config.setPoolName("SteveBudgetPostgresPool");

                return new HikariDataSource(config);

            } catch (Exception e) {
                logger.error("❌ Failed to parse PostgreSQL DATABASE_URL: {}. Falling back to default configuration.", e.getMessage());
            }
        } else if (rawUrl.startsWith("jdbc:postgresql:")) {
            logger.info("🐘 Initializing PostgreSQL DataSource from JDBC URL: {}", rawUrl);
            config.setJdbcUrl(rawUrl);
            config.setUsername(defaultUsername);
            config.setPassword(defaultPassword);
            config.setDriverClassName("org.postgresql.Driver");
            config.setMaximumPoolSize(10);
            return new HikariDataSource(config);
        }

        // 2. Default Local Development Fallback: H2 Database
        String h2Url = !rawUrl.isBlank() ? rawUrl : "jdbc:h2:mem:budgetdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE";
        logger.info("💾 Initializing H2 In-Memory DataSource for local development / testing: {}", h2Url);

        config.setJdbcUrl(h2Url);
        config.setUsername(defaultUsername);
        config.setPassword(defaultPassword);
        config.setDriverClassName("org.h2.Driver");
        config.setMaximumPoolSize(5);
        config.setPoolName("SteveBudgetH2Pool");

        return new HikariDataSource(config);
    }
}

