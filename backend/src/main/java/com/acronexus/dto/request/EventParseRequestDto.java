package com.acronexus.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class EventParseRequestDto {
    @NotBlank(message = "Text cannot be blank")
    private String text;
}
