package com.aiinterview.controller;

import com.aiinterview.dto.InterviewAnalyzeRequest;
import com.aiinterview.dto.InterviewResponse;
import com.aiinterview.service.InterviewFlowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/interviews")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewFlowService interviewFlowService;

    @PostMapping("/analyze")
    public ResponseEntity<InterviewResponse> analyze(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody InterviewAnalyzeRequest request) {
        InterviewResponse saved = interviewFlowService.analyzeAndSave(principal.getUsername(), request);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/history")
    public ResponseEntity<List<InterviewResponse>> history(@AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(interviewFlowService.listInterviews(principal.getUsername()));
    }

    @GetMapping("/keywords")
    public ResponseEntity<List<String>> keywords(@AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(interviewFlowService.latestSkills(principal.getUsername()));
    }
}
