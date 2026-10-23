package com.acronexus.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "faculty_research_contributions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class FacultyResearchContribution extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faculty_id", nullable = false)
    private Faculty faculty;

    // SCI, SCOPUS, UGC, BOOK, BOOK_CHAPTER, PATENT, PROJECT, CONSULTANCY
    @Column(name = "category", nullable = false)
    private String category;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "journal_or_publisher_or_agency")
    private String journalOrPublisherOrAgency;

    @Column(name = "publication_date")
    private String publicationDate;

    @Column(name = "issn_or_isbn_or_patent_no")
    private String issnOrIsbnOrPatentNo;

    @Column(name = "url", length = 500)
    private String url;

    @Column(name = "document_url", length = 500)
    private String documentUrl;

    @Column(name = "amount")
    private String amount;

    @Column(name = "status")
    private String status;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;
}
