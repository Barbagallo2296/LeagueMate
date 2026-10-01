package com.leaguemate.api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_round_recaps")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AiRoundRecap {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "round_id", nullable = false, unique = true)
    private Round round;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RecapStatus status;

    @Column(length = 2000)
    private String content;

    @Column(length = 100)
    private String model;

    @Column(name = "generated_at")
    private LocalDateTime generatedAt;

    @Column(name = "error_message")
    private String errorMessage;
}
