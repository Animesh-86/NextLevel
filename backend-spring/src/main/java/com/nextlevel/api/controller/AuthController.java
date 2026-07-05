package com.nextlevel.api.controller;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.annotation.Validated;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import com.nextlevel.api.dto.ApiResponse;
import com.nextlevel.api.security.CurrentUser;
import com.nextlevel.api.dto.LoginRequest;
import com.nextlevel.api.dto.RegisterRequest;
import com.nextlevel.api.model.User;
import com.nextlevel.api.model.UserRole;
import com.nextlevel.api.repository.UserRepository;
import com.nextlevel.api.security.JwtService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Map<String, Object>>> register(@Validated @RequestBody RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("User already exists with this email. Please sign in."));
        }

        Instant now = Instant.now();
        User user = new User();
        user.setName(request.getName().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(UserRole.student);
        user.setCreatedAt(now);
        user.setUpdatedAt(now);

        User saved = userRepository.save(user);

        Map<String, Object> data = new HashMap<>();
        data.put("id", saved.getId());
        data.put("name", saved.getName());
        data.put("email", saved.getEmail());
        data.put("role", saved.getRole().name());

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(data));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(@Validated @RequestBody LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("No account found with this email"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid password");
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());

        Map<String, Object> userData = new HashMap<>();
        userData.put("id", user.getId());
        userData.put("name", user.getName());
        userData.put("email", user.getEmail());
        userData.put("role", user.getRole().name());

        Map<String, Object> data = new HashMap<>();
        data.put("user", userData);
        data.put("token", token);

        ResponseCookie cookie = ResponseCookie.from("token", token)
                .httpOnly(true)
                .path("/")
                .maxAge(30 * 24 * 60 * 60)
                .sameSite("Lax")
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(ApiResponse.success(data));
    }
    
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> me(@AuthenticationPrincipal CurrentUser currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized"));
        }
        
        Map<String, Object> userData = new HashMap<>();
        userData.put("id", currentUser.getUserId());
        userData.put("email", currentUser.getEmail());
        userData.put("role", currentUser.getRole());
        // In a real app we'd fetch the User entity to get the name, but this is a quick verify
        
        Map<String, Object> data = new HashMap<>();
        data.put("user", userData);
        
        return ResponseEntity.ok(ApiResponse.success(data));
    }
    
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        ResponseCookie cookie = ResponseCookie.from("token", "")
                .httpOnly(true)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(ApiResponse.message("Logged out successfully"));
    }
}
