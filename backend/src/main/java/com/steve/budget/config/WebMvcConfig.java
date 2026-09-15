package com.steve.budget.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

/**
 * WebMvcConfig
 * Configures static resource handling for embedded React PWA frontend in Spring Boot.
 * Handles SPA fallback routing so PWA deep-links and client-side refreshes resolve to index.html.
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        Resource requestedResource = location.createRelative(resourcePath);
                        // If file exists (e.g. sw.js, manifest.webmanifest, icons, css, js), serve it directly
                        if (requestedResource.exists() && requestedResource.isReadable()) {
                            return requestedResource;
                        }
                        // Do not route API, health, or h2-console endpoints to index.html
                        if (resourcePath.startsWith("api") ||
                            resourcePath.startsWith("health") ||
                            resourcePath.startsWith("h2-console")) {
                            return null;
                        }
                        // Fallback to index.html for Single Page Application client routing & PWA shortcuts
                        return location.createRelative("index.html");
                    }
                });
    }
}
