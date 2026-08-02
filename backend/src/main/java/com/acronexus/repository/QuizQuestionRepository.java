package com.acronexus.repository;

import com.acronexus.entity.QuizQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, UUID> {
    List<QuizQuestion> findByQuiz_Id(UUID quizId);
    long countByQuiz_Id(UUID quizId);

    @org.springframework.data.jpa.repository.Modifying
    void deleteByQuiz_Id(UUID quizId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM QuizQuestion qq WHERE qq.quiz.classSubject.id IN :csIds")
    void deleteByClassSubjectIds(@org.springframework.data.repository.query.Param("csIds") List<UUID> csIds);
}
