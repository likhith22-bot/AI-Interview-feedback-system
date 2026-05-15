package com.aiinterview.service;

import com.aiinterview.dto.InterviewAnalyzeRequest;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiClientService {

    private final RestTemplate restTemplate;

    @Value("${app.ai.base-url}")
    private String aiBaseUrl;

    public ParseResumeResult parseResume(byte[] fileBytes, String originalFilename) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            ByteArrayResource resource = new ByteArrayResource(fileBytes) {
                @Override
                public String getFilename() {
                    return originalFilename != null ? originalFilename : "resume.pdf";
                }
            };
            HttpHeaders partHeaders = new HttpHeaders();
            partHeaders.setContentType(MediaType.APPLICATION_PDF);
            body.add("resume", new HttpEntity<>(resource, partHeaders));
            HttpEntity<MultiValueMap<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<ParseResumeResult> response = restTemplate.exchange(
                    aiBaseUrl + "/parse-resume",
                    HttpMethod.POST,
                    entity,
                    ParseResumeResult.class);
            ParseResumeResult r = response.getBody();
            return r != null ? r : ParseResumeResult.empty();
        } catch (RestClientException e) {
            log.warn("AI parse-resume failed: {}", e.getMessage());
            return ParseResumeResult.empty();
        }
    }

    @SuppressWarnings("unchecked")
    public List<String> generateQuestions(List<String> skills) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            Map<String, Object> payload = Map.of("skills", skills != null ? skills : List.of());
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                    aiBaseUrl + "/generate-questions",
                    HttpMethod.POST,
                    entity,
                    Map.class);
            if (response.getBody() == null) {
                return List.of();
            }
            Object q = response.getBody().get("questions");
            if (q instanceof List<?> list) {
                return list.stream().map(Object::toString).toList();
            }
            return List.of();
        } catch (RestClientException e) {
            log.warn("AI generate-questions failed: {}", e.getMessage());
            return List.of();
        }
    }

    public AiAnalyzeResult analyzeInterview(InterviewAnalyzeRequest request) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            Map<String, Object> payload = Map.of(
                    "question", request.getQuestion(),
                    "answer", request.getAnswer(),
                    "keywords", request.getKeywords() != null ? request.getKeywords() : List.of());
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
            ResponseEntity<AiAnalyzeResult> response = restTemplate.exchange(
                    aiBaseUrl + "/analyze-interview",
                    HttpMethod.POST,
                    entity,
                    AiAnalyzeResult.class);
            AiAnalyzeResult r = response.getBody();
            return r != null ? r : AiAnalyzeResult.fallback();
        } catch (RestClientException e) {
            log.warn("AI analyze-interview failed: {}", e.getMessage());
            return AiAnalyzeResult.fallback();
        }
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ParseResumeResult {
        private List<String> skills;
        private String text;

        static ParseResumeResult empty() {
            ParseResumeResult p = new ParseResumeResult();
            p.setSkills(Collections.emptyList());
            p.setText("");
            return p;
        }
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class AiAnalyzeResult {
        @JsonProperty("technical_score")
        private Integer technicalScore;
        @JsonProperty("grammar_score")
        private Integer grammarScore;
        @JsonProperty("english_score")
        private Integer englishScore;
        @JsonProperty("confidence_score")
        private Integer confidenceScore;
        @JsonProperty("overall_score")
        private Integer overallScore;
        private String feedback;
        @JsonProperty("weak_topics")
        private String weakTopics;

        static AiAnalyzeResult fallback() {
            AiAnalyzeResult a = new AiAnalyzeResult();
            a.setTechnicalScore(5);
            a.setGrammarScore(5);
            a.setEnglishScore(5);
            a.setConfidenceScore(5);
            a.setOverallScore(50);
            a.setFeedback("AI service unavailable — scores are placeholders. Start the Python ai-service.");
            a.setWeakTopics("n/a");
            return a;
        }
    }
}
