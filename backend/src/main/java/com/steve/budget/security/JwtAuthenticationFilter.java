package com.steve.budget.security;

import com.steve.budget.model.User;
import com.steve.budget.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtUtils jwtUtils;
    private final CustomUserDetailsService userDetailsService;
    private final FirebaseTokenVerifier firebaseTokenVerifier;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtUtils jwtUtils,
                                   CustomUserDetailsService userDetailsService,
                                   FirebaseTokenVerifier firebaseTokenVerifier,
                                   UserRepository userRepository) {
        this.jwtUtils = jwtUtils;
        this.userDetailsService = userDetailsService;
        this.firebaseTokenVerifier = firebaseTokenVerifier;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String token = parseToken(request);
            if (token != null) {
                // 1. Try validating as backend-issued JWT
                if (jwtUtils.validateJwtToken(token)) {
                    String username = jwtUtils.getUsernameFromJwtToken(token);
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                            );
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
                // 2. Otherwise try validating as Firebase ID token
                else if (firebaseTokenVerifier != null) {
                    FirebaseTokenVerifier.FirebaseUserInfo userInfo = firebaseTokenVerifier.verifyToken(token);
                    if (userInfo != null) {
                        Optional<User> userOpt = Optional.empty();
                        if (userInfo.getEmail() != null) {
                            userOpt = userRepository.findByEmail(userInfo.getEmail().toLowerCase());
                        }
                        if (userOpt.isEmpty()) {
                            userOpt = userRepository.findByUsername("fb_" + userInfo.getUid());
                        }

                        if (userOpt.isPresent()) {
                            UserDetails userDetails = UserPrincipal.build(userOpt.get());
                            UsernamePasswordAuthenticationToken authentication =
                                    new UsernamePasswordAuthenticationToken(
                                            userDetails,
                                            null,
                                            userDetails.getAuthorities()
                                    );
                            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                            SecurityContextHolder.getContext().setAuthentication(authentication);
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Cannot set user authentication in SecurityContext: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private String parseToken(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");

        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }

        return null;
    }
}
