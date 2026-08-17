package com.acronexus.controller;
import com.acronexus.entity.ExamResult;
import com.acronexus.repository.ExamResultRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@RestController
public class UpdateController {
    private final ExamResultRepository repository;
    public UpdateController(ExamResultRepository repository) { this.repository = repository; }
    
    @GetMapping("/api/public/update-class")
    @Transactional
    public String updateClass() {
        try {
            List<ExamResult> results = repository.findAll();
            int count = 0;
            for(ExamResult r : results) {
                if (r.getClassName() == null || r.getClassName().isEmpty() || r.getClassName().equals("Unknown Class")) {
                    r.setClassName("first");
                    repository.save(r);
                    count++;
                }
            }
            return "Updated " + count + " records";
        } catch (Exception e) {
            return "Error: " + e.getMessage();
        }
    }
}
