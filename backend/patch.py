import sys

file_path = r'c:\A\Development\ACADRO\ACADRO\backend\src\main\java\com\acronexus\service\StudentService.java'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add repositories
old_repos = '''    private final com.acronexus.repository.ExaminationEligibilityStudentRepository examinationEligibilityStudentRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;'''
new_repos = '''    private final com.acronexus.repository.ExaminationEligibilityStudentRepository examinationEligibilityStudentRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;
    private final com.acronexus.repository.AcroClassRepository acroClassRepository;
    private final com.acronexus.repository.AcademicYearRepository academicYearRepository;
    private final com.acronexus.repository.SemesterRepository semesterRepository;
    private final com.acronexus.repository.AcademicRecordRepository academicRecordRepository;'''
content = content.replace(old_repos, new_repos)

# 2. Add options & export methods before createStudent
old_create_start = '''    @Transactional
    public StudentResponseDto createStudent(StudentRequestDto request) {'''
new_methods = '''    @Transactional(readOnly = true)
    public List<com.acronexus.dto.OptionDto> getAcademicYearOptions() {
        return academicYearRepository.findAll().stream()
                .map(y -> new com.acronexus.dto.OptionDto(y.getId(), y.getYear()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<com.acronexus.dto.OptionDto> getSemesterOptions(UUID academicYearId) {
        return semesterRepository.findAll().stream()
                .filter(s -> s.getAcademicYear() != null && s.getAcademicYear().getId().equals(academicYearId))
                .map(s -> new com.acronexus.dto.OptionDto(s.getId(), "Semester " + s.getSemesterNumber()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<com.acronexus.dto.OptionDto> getClassOptions() {
        return acroClassRepository.findAll().stream()
                .map(c -> {
                    String label = c.getName();
                    if (c.getSection() != null && !c.getSection().trim().isEmpty()) {
                        label += " - " + c.getSection();
                    }
                    return new com.acronexus.dto.OptionDto(c.getId(), label);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public byte[] exportStudentsToExcel(String search, String batch, String className, String status) {
        Pageable customPageable = org.springframework.data.domain.PageRequest.of(0, 100000);
        List<StudentResponseDto> students = studentRepository.findAllWithFilters(search, batch, status, className, customPageable)
                .map(this::mapToDto).getContent();

        try (org.apache.poi.xssf.usermodel.XSSFWorkbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook();
             java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream()) {
            
            org.apache.poi.xssf.usermodel.XSSFSheet sheet = workbook.createSheet("Students");
            org.apache.poi.xssf.usermodel.XSSFRow headerRow = sheet.createRow(0);
            String[] columns = {"Enrollment Number", "Student Name", "Gender", "DOB", "College Email", "Personal Email", "Phone", "WhatsApp Number", "Blood Group", "Category", "Nationality", "Residence Type", "Batch", "Academic Year", "Semester", "Class", "Section", "Status", "SGPA Semester 1", "SGPA Semester 2", "SGPA Semester 3", "SGPA Semester 4", "SGPA Semester 5", "SGPA Semester 6", "SGPA Semester 7", "SGPA Semester 8", "CGPA"};
            for (int i = 0; i < columns.length; i++) {
                headerRow.createCell(i).setCellValue(columns[i]);
            }

            int rowIdx = 1;
            for (StudentResponseDto s : students) {
                org.apache.poi.xssf.usermodel.XSSFRow row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(s.getEnrollmentNumber() != null ? s.getEnrollmentNumber() : "");
                row.createCell(1).setCellValue(s.getName() != null ? s.getName() : "");
                row.createCell(2).setCellValue(s.getGender() != null ? s.getGender() : "");
                row.createCell(3).setCellValue(s.getDob() != null ? s.getDob() : "");
                row.createCell(4).setCellValue(s.getCollegeEmail() != null ? s.getCollegeEmail() : "");
                row.createCell(5).setCellValue(s.getPersonalEmail() != null ? s.getPersonalEmail() : "");
                row.createCell(6).setCellValue(s.getPhone() != null ? s.getPhone() : "");
                row.createCell(7).setCellValue(s.getWhatsappNumber() != null ? s.getWhatsappNumber() : "");
                row.createCell(8).setCellValue(s.getBloodGroup() != null ? s.getBloodGroup() : "");
                row.createCell(9).setCellValue(s.getCategory() != null ? s.getCategory() : "");
                row.createCell(10).setCellValue(s.getNationality() != null ? s.getNationality() : "");
                row.createCell(11).setCellValue(s.getResidenceType() != null ? s.getResidenceType() : "");
                row.createCell(12).setCellValue(s.getBatch() != null ? s.getBatch() : "");
                row.createCell(13).setCellValue(s.getYear() != null ? s.getYear() : "");
                row.createCell(14).setCellValue(s.getSemester() != null ? s.getSemester() : "");
                row.createCell(15).setCellValue(s.getCourse() != null ? s.getCourse() : "");
                row.createCell(16).setCellValue(s.getSection() != null ? s.getSection() : "");
                row.createCell(17).setCellValue(s.getStatus() != null ? s.getStatus() : "");
                row.createCell(18).setCellValue(s.getSgpaSem1() != null ? s.getSgpaSem1().toString() : "");
                row.createCell(19).setCellValue(s.getSgpaSem2() != null ? s.getSgpaSem2().toString() : "");
                row.createCell(20).setCellValue(s.getSgpaSem3() != null ? s.getSgpaSem3().toString() : "");
                row.createCell(21).setCellValue(s.getSgpaSem4() != null ? s.getSgpaSem4().toString() : "");
                row.createCell(22).setCellValue(s.getSgpaSem5() != null ? s.getSgpaSem5().toString() : "");
                row.createCell(23).setCellValue(s.getSgpaSem6() != null ? s.getSgpaSem6().toString() : "");
                row.createCell(24).setCellValue(s.getSgpaSem7() != null ? s.getSgpaSem7().toString() : "");
                row.createCell(25).setCellValue(s.getSgpaSem8() != null ? s.getSgpaSem8().toString() : "");
                row.createCell(26).setCellValue(s.getCgpa() != null ? s.getCgpa().toString() : "");
            }
            workbook.write(out);
            return out.toByteArray();
        } catch (java.io.IOException e) {
            throw new RuntimeException("Failed to generate Excel file", e);
        }
    }

    @Transactional
    public StudentResponseDto createStudent(StudentRequestDto request) {'''
content = content.replace(old_create_start, new_methods)

# 3. Update createStudent
old_create = '''        Student savedStudent = studentRepository.save(student);

        return mapToDto(savedStudent);
    }'''
new_create = '''        Student savedStudent = studentRepository.save(student);

        // Safe Enrollment Creation
        if (request.getClassId() != null || request.getAcademicYearId() != null || request.getSemesterId() != null) {
            StudentEnrollment enrollment = new StudentEnrollment();
            enrollment.setStudent(savedStudent);
            enrollment.setIsActive(true);
            if (request.getClassId() != null) {
                acroClassRepository.findById(request.getClassId()).ifPresent(enrollment::setAcroClass);
            }
            if (request.getAcademicYearId() != null) {
                academicYearRepository.findById(request.getAcademicYearId()).ifPresent(enrollment::setAcademicYear);
            }
            if (request.getSemesterId() != null) {
                semesterRepository.findById(request.getSemesterId()).ifPresent(enrollment::setSemester);
            }
            enrollmentRepository.save(enrollment);
        }

        return mapToDto(savedStudent);
    }'''
content = content.replace(old_create, new_create)

# 4. Update updateStudent
old_update = '''        user.setLastName(nameParts.length > 1 ? nameParts[1] : "");
        try {
            user.setGender(Gender.valueOf(request.getGender().toUpperCase()));
        } catch (Exception e) {
            user.setGender(Gender.OTHER);
        }
        userRepository.save(user);
        
        Student savedStudent = studentRepository.save(student);
        return mapToDto(savedStudent);
    }'''
new_update = '''        user.setLastName(nameParts.length > 1 ? nameParts[1] : "");
        try {
            user.setGender(Gender.valueOf(request.getGender().toUpperCase()));
        } catch (Exception e) {
            user.setGender(Gender.OTHER);
        }
        if (request.getStatus() != null) {
            user.setIsActive("Active".equalsIgnoreCase(request.getStatus()));
        }
        userRepository.save(user);
        
        Student savedStudent = studentRepository.save(student);

        // Update active enrollment safely
        if (request.getClassId() != null || request.getAcademicYearId() != null || request.getSemesterId() != null) {
            java.util.Optional<StudentEnrollment> activeEnrollmentOpt = enrollmentRepository.findFirstByStudentUserIdAndIsActiveTrueOrderByCreatedAtDesc(id);
            StudentEnrollment enrollment = activeEnrollmentOpt.orElseGet(() -> {
                StudentEnrollment newEnrollment = new StudentEnrollment();
                newEnrollment.setStudent(savedStudent);
                newEnrollment.setIsActive(true);
                return newEnrollment;
            });

            if (request.getClassId() != null) {
                acroClassRepository.findById(request.getClassId()).ifPresent(enrollment::setAcroClass);
            }
            if (request.getAcademicYearId() != null) {
                academicYearRepository.findById(request.getAcademicYearId()).ifPresent(enrollment::setAcademicYear);
            }
            if (request.getSemesterId() != null) {
                semesterRepository.findById(request.getSemesterId()).ifPresent(enrollment::setSemester);
            }
            enrollmentRepository.save(enrollment);
        }

        return mapToDto(savedStudent);
    }'''
content = content.replace(old_update, new_update)

# 5. Update mapToDto for SGPA and CGPA
old_map = '''        if (dto.getClassName() == null) dto.setClassName("Unassigned");

        return dto;
    }'''
new_map = '''        if (dto.getClassName() == null) dto.setClassName("Unassigned");

        // Fetch Academic Record for SGPA/CGPA
        academicRecordRepository.findByStudentId(student.getId()).ifPresent(ar -> {
            dto.setSgpaSem1(ar.getSgpaSem1());
            dto.setSgpaSem2(ar.getSgpaSem2());
            dto.setSgpaSem3(ar.getSgpaSem3());
            dto.setSgpaSem4(ar.getSgpaSem4());
            dto.setSgpaSem5(ar.getSgpaSem5());
            dto.setSgpaSem6(ar.getSgpaSem6());
            dto.setSgpaSem7(ar.getSgpaSem7());
            dto.setSgpaSem8(ar.getSgpaSem8());
            dto.setCgpa(ar.getCgpa());
        });

        return dto;
    }'''
content = content.replace(old_map, new_map)

# Also update mapToDto for exact IDs
old_map_2 = '''            });

        if (dto.getClassName() == null && student.getCourse() != null) {'''
new_map_2 = '''                if (enrollment.getAcroClass() != null) {
                    dto.setClassId(enrollment.getAcroClass().getId());
                }
                if (enrollment.getAcademicYear() != null) {
                    dto.setAcademicYearId(enrollment.getAcademicYear().getId());
                }
                if (enrollment.getSemester() != null) {
                    dto.setSemesterId(enrollment.getSemester().getId());
                }
            });

        if (dto.getClassName() == null && student.getCourse() != null) {'''
content = content.replace(old_map_2, new_map_2)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("StudentService updated successfully!")
