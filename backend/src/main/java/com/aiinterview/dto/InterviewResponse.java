package com.aiinterview.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewResponse {
    private Long id;
    private Integer score;
    private Integer confidenceScore;
    private Integer englishScore;
    private Integer technicalScore;
    private String feedback;
    private String weakTopics;
    private String questionAsked;
    private String answerSummary;
    private Instant createdAt;
}
