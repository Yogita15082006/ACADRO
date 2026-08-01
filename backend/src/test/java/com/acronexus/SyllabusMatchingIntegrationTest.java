package com.acronexus;

import com.acronexus.entity.ClassSubject;
import com.acronexus.repository.ClassSubjectRepository;
import com.acronexus.service.ClassSubjectService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@SpringBootTest
public class SyllabusMatchingIntegrationTest {

    @Autowired
    private ClassSubjectService classSubjectService;

    @Autowired
    private ClassSubjectRepository classSubjectRepository;

    @Test
    @Transactional
    public void verifySyllabusMatchingPipeline() {
        System.out.println("\n==================================================");
        System.out.println("STARTING VERIFICATION OF SYLLABUS MATCHING PIPELINE");
        System.out.println("==================================================");

        // Force execution of matching for all unlinked active subject cards
        classSubjectService.onApplicationReady();

        List<ClassSubject> allCards = classSubjectRepository.findAll();
        int total = allCards.size();
        int linked = 0;

        for (ClassSubject cs : allCards) {
            String code = cs.getSubject() != null ? cs.getSubject().getCode() : "N/A";
            String name = cs.getSubject() != null ? cs.getSubject().getName() : "N/A";
            String cls = cs.getAcroClass() != null ? cs.getAcroClass().getName() : "N/A";

            Map<String, Object> syllabus = classSubjectService.getSubjectSyllabus(cs.getId());
            if (syllabus != null) {
                linked++;
                System.out.println("✅ Subject Card [" + code + " - " + name + " (" + cls + ")] -> MATCHED Syllabus Subject Code: " + syllabus.get("subjectCode"));
            } else {
                System.out.println("❌ Subject Card [" + code + " - " + name + " (" + cls + ")] -> NO SYLLABUS MATCHED");
            }
        }

        System.out.println("\n==================================================");
        System.out.println("VERIFICATION RESULT: " + linked + " / " + total + " Subject Cards linked to syllabus.");
        System.out.println("==================================================\n");
    }
}
