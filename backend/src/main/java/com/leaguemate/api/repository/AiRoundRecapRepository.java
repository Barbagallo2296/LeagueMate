package com.leaguemate.api.repository;

import com.leaguemate.api.entity.AiRoundRecap;
import com.leaguemate.api.entity.RecapStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AiRoundRecapRepository extends JpaRepository<AiRoundRecap, Long> {

    Optional<AiRoundRecap> findByRoundId(Long roundId);

    List<AiRoundRecap> findByStatus(RecapStatus status);
}
