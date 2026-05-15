-- AI Interview Assessment — MySQL schema (JPA can also auto-create tables)
CREATE DATABASE IF NOT EXISTS ai_interview CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ai_interview;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS resumes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    original_filename VARCHAR(500),
    stored_path VARCHAR(1000),
    skills_json TEXT,
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_resume_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS interviews (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    score INT NOT NULL,
    confidence_score INT NOT NULL,
    english_score INT NOT NULL,
    technical_score INT NOT NULL,
    feedback VARCHAR(2000),
    weak_topics VARCHAR(1000),
    question_asked VARCHAR(2000),
    answer_summary TEXT,
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_interview_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX idx_interviews_user_created ON interviews (user_id, created_at);
CREATE INDEX idx_resumes_user_created ON resumes (user_id, created_at);
