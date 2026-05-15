package com.aiinterview.service;

import com.aiinterview.dto.*;
import com.aiinterview.model.Interview;
import com.aiinterview.model.ResumeRecord;
import com.aiinterview.model.User;
import com.aiinterview.repository.InterviewRepository;
import com.aiinterview.repository.ResumeRecordRepository;
import com.aiinterview.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InterviewFlowService {

    private final UserRepository userRepository;
    private final InterviewRepository interviewRepository;
    private final ResumeRecordRepository resumeRecordRepository;
    private final AiClientService aiClientService;
    private final ObjectMapper objectMapper;

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Transactional
    public ResumeUploadResponse handleResumeUpload(String email, MultipartFile file) throws IOException {
        User user = userRepository.findByEmail(email).orElseThrow();
        Files.createDirectories(Paths.get(uploadDir, String.valueOf(user.getId())));

        byte[] data = file.getBytes();
        String safeName = UUID.randomUUID() + "_" + (file.getOriginalFilename() != null ? file.getOriginalFilename() : "resume.pdf");
        Path target = Paths.get(uploadDir, String.valueOf(user.getId()), safeName);
        Files.write(target, data);

        AiClientService.ParseResumeResult parsed = aiClientService.parseResume(data, file.getOriginalFilename());
        List<String> skills = parsed.getSkills() != null ? parsed.getSkills() : List.of();
        List<String> questions = aiClientService.generateQuestions(skills);

        String skillsJson;
        try {
            skillsJson = objectMapper.writeValueAsString(skills);
        } catch (JsonProcessingException e) {
            skillsJson = "[]";
        }

        ResumeRecord record = ResumeRecord.builder()
                .user(user)
                .originalFilename(file.getOriginalFilename())
                .storedPath(target.toString())
                .skillsJson(skillsJson)
                .createdAt(Instant.now())
                .build();
        record = resumeRecordRepository.save(record);

        return ResumeUploadResponse.builder()
                .resumeId(record.getId())
                .skills(skills)
                .questions(questions)
                .extractedPreview(truncate(parsed.getText(), 2000))
                .build();
    }

    private static String truncate(String s, int max) {
        if (s == null) {
            return "";
        }
        return s.length() <= max ? s : s.substring(0, max) + "...";
    }

    @Transactional
    public InterviewResponse analyzeAndSave(String email, InterviewAnalyzeRequest request) {
        User user = userRepository.findByEmail(email).orElseThrow();
        AiClientService.AiAnalyzeResult ai = aiClientService.analyzeInterview(request);

        int overall = ai.getOverallScore() != null ? clampPercent(ai.getOverallScore()) : 50;
        Interview interview = Interview.builder()
                .user(user)
                .score(overall)
                .confidenceScore(clampTen(ai.getConfidenceScore()))
                .englishScore(clampTen(ai.getEnglishScore()))
                .technicalScore(clampTen(ai.getTechnicalScore()))
                .feedback(ai.getFeedback() != null ? ai.getFeedback() : "")
                .weakTopics(ai.getWeakTopics() != null ? ai.getWeakTopics() : "")
                .questionAsked(request.getQuestion())
                .answerSummary(truncate(request.getAnswer(), 4000))
                .createdAt(Instant.now())
                .build();
        interview = interviewRepository.save(interview);
        return toResponse(interview);
    }

    @Transactional(readOnly = true)
    public List<InterviewResponse> listInterviews(String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        return interviewRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<String> latestSkills(String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        return resumeRecordRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .findFirst()
                .map(r -> {
                    try {
                        return objectMapper.readValue(r.getSkillsJson(), new TypeReference<List<String>>() {});
                    } catch (Exception e) {
                        return List.<String>of();
                    }
                })
                .orElse(List.of());
    }

    private InterviewResponse toResponse(Interview i) {
        return InterviewResponse.builder()
                .id(i.getId())
                .score(i.getScore())
                .confidenceScore(i.getConfidenceScore())
                .englishScore(i.getEnglishScore())
                .technicalScore(i.getTechnicalScore())
                .feedback(i.getFeedback())
                .weakTopics(i.getWeakTopics())
                .questionAsked(i.getQuestionAsked())
                .answerSummary(i.getAnswerSummary())
                .createdAt(i.getCreatedAt())
                .build();
    }

    private static int clampTen(Integer v) {
        if (v == null) {
            return 0;
        }
        return Math.max(0, Math.min(10, v));
    }

    private static int clampPercent(Integer v) {
        if (v == null) {
            return 0;
        }
        return Math.max(0, Math.min(100, v));
    }
}
