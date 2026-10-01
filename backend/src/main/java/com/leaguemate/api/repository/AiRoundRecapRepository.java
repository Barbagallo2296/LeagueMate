package com.leaguemate.api.repository;

import com.leaguemate.api.entity.AiRoundRecap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AiRoundRecapRepository extends JpaRepository<AiRoundRecap, Long> {

    Optional<AiRoundRecap> findByRoundId(Long roundId);
}
