package com.leaguemate.api.service.impl;

import com.leaguemate.api.ai.recap.RoundCompletedEvent;
import com.leaguemate.api.entity.Match;
import com.leaguemate.api.entity.MatchStatus;
import com.leaguemate.api.entity.Round;
import com.leaguemate.api.entity.TournamentStatus;
import com.leaguemate.api.exception.ResourceConflictException;
import com.leaguemate.api.exception.ResourceNotFoundException;
import com.leaguemate.api.repository.MatchRepository;
import com.leaguemate.api.repository.RoundRepository;
import com.leaguemate.api.service.MatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MatchServiceImpl implements MatchService {

    private final MatchRepository matchRepository;
    private final RoundRepository roundRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public Match updateMatchResult(Long id, Integer homeScore, Integer awayScore) {
        Match match = matchRepository.findByIdWithTeams(id)
                .orElseThrow(() -> new ResourceNotFoundException("Match not found with id: " + id));

        TournamentStatus tournamentStatus = match.getRound().getTournament().getStatus();
        if (tournamentStatus != TournamentStatus.ACTIVE) {
            throw new ResourceConflictException(
                    "Match results can only be updated while the tournament is ACTIVE. Current status: "
                            + tournamentStatus);
        }

        match.setHomeScore(homeScore);
        match.setAwayScore(awayScore);
        match.setStatus(MatchStatus.COMPLETED);

        Match saved = matchRepository.save(match);

        Round round = match.getRound();
        if (matchRepository.countByRoundIdAndStatus(round.getId(), MatchStatus.SCHEDULED) == 0) {
            eventPublisher.publishEvent(new RoundCompletedEvent(
                    round.getTournament().getId(), round.getId(), round.getRoundNumber()));
        }

        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Match> getMatchesByRound(Long roundId) {
        if (!roundRepository.existsById(roundId)) {
            throw new ResourceNotFoundException("Round not found with id: " + roundId);
        }
        return matchRepository.findByRoundIdWithTeams(roundId);
    }
}