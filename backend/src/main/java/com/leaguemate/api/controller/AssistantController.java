package com.leaguemate.api.controller;

import com.leaguemate.api.ai.assistant.AssistantRateLimiter;
import com.leaguemate.api.ai.assistant.TournamentAssistantService;
import com.leaguemate.api.dto.AssistantRequest;
import com.leaguemate.api.dto.AssistantResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tournaments/{tournamentId}/assistant")
@RequiredArgsConstructor
public class AssistantController {

    private final TournamentAssistantService assistantService;
    private final AssistantRateLimiter rateLimiter;

    @PostMapping
    public ResponseEntity<AssistantResponse> ask(@PathVariable Long tournamentId,
                                                 @Valid @RequestBody AssistantRequest request,
                                                 Authentication authentication) {
        rateLimiter.check(authentication.getName());
        return ResponseEntity.ok(assistantService.ask(tournamentId, request.question()));
    }
}
