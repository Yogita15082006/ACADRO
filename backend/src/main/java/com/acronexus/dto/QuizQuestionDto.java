package com.acronexus.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public class QuizQuestionDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Option {
        private String id; // Can be A, B, C, D or UUID
        private String text;
        private boolean isCorrect;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Response {
        private UUID id;
        private UUID quizId;
        private String questionText;
        private List<Option> options;
        private Integer marks;
        private String questionType;
        private String correctAnswer;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CreateRequest {
        private UUID quizId;

        @NotBlank(message = "Question text is required")
        private String questionText;

        private List<Option> options;

        @NotNull(message = "Marks are required")
        private Integer marks;

        private String questionType;
        private String correctAnswer;
        private Integer questionNumber;
        private String explanation;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class UpdateRequest {
        @NotBlank(message = "Question text is required")
        private String questionText;

        private List<Option> options;

        @NotNull(message = "Marks are required")
        private Integer marks;

        private String questionType;
        private String correctAnswer;
    }
}

