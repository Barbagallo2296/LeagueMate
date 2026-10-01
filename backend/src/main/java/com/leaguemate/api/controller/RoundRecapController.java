package com.leaguemate.api.controller;

import com.leaguemate.api.ai.recap.RoundRecapService;
import com.leaguemate.api.dto.RoundRecapResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tournaments/{tournamentId}/rounds/{roundNumber}/recap")
@RequiredArgsConstructor
public class RoundRecapController {

    private static final String OWNER_OR_ADMIN =
            "hasRole('ADMIN') or (hasRole('ORGANIZER') and @tournamentSecurity.isOrganizer(#tournamentId, authentication))";

    private final RoundRecapService recapService;

    @GetMapping
    public ResponseEntity<RoundRecapResponse> getRecap(@PathVariable Long tournamentId,
                                                       @PathVariable int roundNumber) {
        return ResponseEntity.ok(recapService.getRecap(tournamentId, roundNumber));
    }

    @PostMapping
    @PreAuthorize(OWNER_OR_ADMIN)
    public ResponseEntity<Void> regenerateRecap(@PathVariable Long tournamentId,
                                                @PathVariable int roundNumber) {
        recapService.requestRegeneration(tournamentId, roundNumber);
        return ResponseEntity.accepted().build();
    }
}
