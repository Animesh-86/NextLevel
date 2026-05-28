package com.nextlevel.api.security;

import java.io.IOException;
import java.time.Instant;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import com.nextlevel.api.model.User;
import com.nextlevel.api.model.UserRole;
import com.nextlevel.api.repository.UserRepository;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final String frontendUrl;

    public OAuth2LoginSuccessHandler(JwtService jwtService, UserRepository userRepository,
                                     @Value("${app.frontend.url:http://localhost:3000}") String frontendUrl) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.frontendUrl = frontendUrl;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        Optional<User> optionalUser = userRepository.findByEmail(email);
        User user;
        if (optionalUser.isPresent()) {
            user = optionalUser.get();
        } else {
            user = new User();
            user.setEmail(email);
            user.setName(name);
            user.setRole(UserRole.student);
            user.setCreatedAt(Instant.now());
            user.setUpdatedAt(Instant.now());
            user = userRepository.save(user);
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());

        String targetUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/login/callback")
                .queryParam("token", token)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
