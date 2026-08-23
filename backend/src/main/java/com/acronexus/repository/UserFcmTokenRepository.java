package com.acronexus.repository;

import com.acronexus.entity.UserFcmToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserFcmTokenRepository extends JpaRepository<UserFcmToken, UUID> {
    List<UserFcmToken> findByUser_IdAndIsActiveTrue(UUID userId);
    Optional<UserFcmToken> findByToken(String token);
}
