package com.acronexus.dto.faculty;

import lombok.*;
import java.time.ZonedDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacultyResearchContributionDto {
    private UUID id;
    private UUID facultyId;
    private String category; // SCI, SCOPUS, UGC, BOOK, BOOK_CHAPTER, PATENT, PROJECT, CONSULTANCY
    private String title;
    private String journalOrPublisherOrAgency;
    private String publicationDate;
    private String issnOrIsbnOrPatentNo;
    private String url;
    private String documentUrl;
    private String amount;
    private String status;
    private String remarks;
    private ZonedDateTime createdAt;
}
