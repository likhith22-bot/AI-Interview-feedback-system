package com.aiinterview.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "interviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Interview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Integer score;

    @Column(name = "confidence_score", nullable = false)
    private Integer confidenceScore;

    @Column(name = "english_score", nullable = false)
    private Integer englishScore;

    @Column(name = "technical_score", nullable = false)
    private Integer technicalScore;

    @Column(length = 2000)
    private String feedback;

    @Column(name = "weak_topics", length = 1000)
    private String weakTopics;

    @Column(name = "question_asked", length = 2000)
    private String questionAsked;

    @Column(name = "answer_summary", columnDefinition = "TEXT")
    private String answerSummary;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
