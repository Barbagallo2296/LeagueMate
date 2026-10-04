package com.leaguemate.api.service.impl;

import com.leaguemate.api.dto.TokenResponse;
import com.leaguemate.api.entity.User;
import com.leaguemate.api.exception.BadRequestException;
import com.leaguemate.api.security.TokenService;
import com.leaguemate.api.service.AuthService;
import com.leaguemate.api.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    private final AuthenticationManager authenticationManager;

    @Override
    @Transactional
    public User register(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userService.registerUser(user);
    }

    @Override
    public TokenResponse login(String username, String password) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password)
        );
        return tokenService.issue(authentication);
    }

    @Override
    public TokenResponse refresh(String refreshToken) {
        return tokenService.refresh(refreshToken);
    }

    @Override
    public void logout(String accessToken) {
        tokenService.revoke(accessToken);
    }

    @Override
    public void logoutAll(String username) {
        tokenService.revokeAll(username);
    }

    @Override
    @Transactional
    public void changePassword(Long userId, String currentPassword, String newPassword) {
        User user = userService.findById(userId);

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new BadRequestException("New password must be different from the current one");
        }

        userService.updatePassword(userId, passwordEncoder.encode(newPassword));
        tokenService.revokeAll(user.getUsername());
    }
}
