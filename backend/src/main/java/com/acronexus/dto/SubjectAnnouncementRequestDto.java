package com.acronexus.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubjectAnnouncementRequestDto {
    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Message content is required")
    private String message;

    private String priority = "Normal";

    public String getTitle() { return this.title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return this.message; }
    public void setMessage(String message) { this.message = message; }
    public String getPriority() { return this.priority; }
    public void setPriority(String priority) { this.priority = priority; }
}
