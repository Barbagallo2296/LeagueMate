CREATE TABLE IF NOT EXISTS ai_round_recaps
(
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    round_id      BIGINT        NOT NULL UNIQUE,
    status        VARCHAR(20)   NOT NULL,
    content       VARCHAR(2000),
    model         VARCHAR(100),
    generated_at  TIMESTAMP     NULL,
    error_message VARCHAR(255),
    CONSTRAINT fk_recap_round FOREIGN KEY (round_id) REFERENCES rounds (id) ON DELETE CASCADE
    );
