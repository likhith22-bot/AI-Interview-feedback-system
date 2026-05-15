package com.aiinterview.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class InterviewAnalyzeRequest {
    @NotBlank
    private String question;

    @NotBlank
    private String answer;

    private List<String> keywords;
}
