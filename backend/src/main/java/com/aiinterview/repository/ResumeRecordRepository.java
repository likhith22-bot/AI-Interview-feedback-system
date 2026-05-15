package com.aiinterview.repository;

import com.aiinterview.model.ResumeRecord;
import com.aiinterview.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResumeRecordRepository extends JpaRepository<ResumeRecord, Long> {
    List<ResumeRecord> findByUserOrderByCreatedAtDesc(User user);
}
