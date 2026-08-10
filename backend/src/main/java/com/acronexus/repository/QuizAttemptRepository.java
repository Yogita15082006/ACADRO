package com.acronexus.repository;

import com.acronexus.entity.QuizAttempt;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, UUID> {
    @EntityGraph(attributePaths = {"quiz", "student", "student.user"})
    List<QuizAttempt> findByStudent_User_Id(UUID studentId);

    @EntityGraph(attributePaths = {"quiz", "student", "student.user"})
    List<QuizAttempt> findByQuiz_Id(UUID quizId);
    boolean existsByQuiz_IdAndStudent_User_Id(UUID quizId, UUID studentId);

    @EntityGraph(attributePaths = {"quiz", "student", "student.user"})
    Optional<QuizAttempt> findByQuiz_IdAndStudent_User_Id(UUID quizId, UUID studentId);

    List<QuizAttempt> findByQuiz_IdIn(List<UUID> quizIds);

    @org.springframework.data.jpa.repository.Modifying
    void deleteByQuiz_Id(UUID quizId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM QuizAttempt qa WHERE qa.quiz.classSubject.id IN :csIds")
    void deleteByClassSubjectIds(@org.springframework.data.repository.query.Param("csIds") List<UUID> csIds);
}
