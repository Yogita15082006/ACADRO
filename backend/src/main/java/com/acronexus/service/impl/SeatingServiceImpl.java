package com.acronexus.service.impl;

import com.acronexus.dto.seating.*;
import com.acronexus.entity.*;
import com.acronexus.exception.ResourceNotFoundException;
import com.acronexus.repository.*;
import com.acronexus.service.SeatingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class SeatingServiceImpl implements SeatingService {

    @Autowired
    private SeatingArrangementRepository seatingArrangementRepository;
    @Autowired
    private ExaminationRepository examinationRepository;
    @Autowired
    private StudentEnrollmentRepository studentEnrollmentRepository;
    @Autowired
    private StudentRepository studentRepository;
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ExaminationEligibilityListRepository eligibilityListRepository;


    @Override
    public SeatingArrangementDto generateSeatingPlan(SeatingGenerateRequestDto request) {
        Examination examination = examinationRepository.findByIdAndIsDeletedFalse(request.getExaminationId())
                .orElseThrow(() -> new ResourceNotFoundException("Examination not found"));

            java.util.List<ExaminationEligibilityList> lists = eligibilityListRepository.findByExaminationIdOrderByCreatedAtDesc(request.getExaminationId());
            if (lists.isEmpty()) throw new ResourceNotFoundException("Eligibility list not found for examination");
            ExaminationEligibilityList eligibilityList = lists.get(0);
        List<StudentEnrollment> enrollments = new ArrayList<>();
        for (ExaminationEligibilityStudent ees : eligibilityList.getStudents()) {
            if (Boolean.TRUE.equals(ees.getIsEligible())) {
                // Find enrollment for this student
                studentEnrollmentRepository.findFirstByStudentIdAndIsActiveTrueOrderByCreatedAtDesc(ees.getStudent().getId())
                    .ifPresent(enrollments::add);
            }
        }
        
        Map<String, List<StudentEnrollment>> studentsByClass = new HashMap<>();
        for (StudentEnrollment enrollment : enrollments) {
            String className = enrollment.getAcroClass().getName();
            if (enrollment.getAcroClass().getSection() != null && !enrollment.getAcroClass().getSection().isEmpty()) {
                className = enrollment.getAcroClass().getSection();
            }
            studentsByClass.computeIfAbsent(className, k -> new ArrayList<>()).add(enrollment);
        }

        for (List<StudentEnrollment> classStudents : studentsByClass.values()) {
            classStudents.sort(Comparator.comparing((StudentEnrollment e) -> e.getStudent().getEnrollmentNo())
                    .thenComparing(e -> e.getStudent().getUser().getFirstName()));
        }

        List<String> classNames = new ArrayList<>(studentsByClass.keySet());
        Map<String, Integer> classPointers = new HashMap<>();
        for (String c : classNames) classPointers.put(c, 0);

        SeatingArrangementDto plan = new SeatingArrangementDto();
        plan.setExaminationId(examination.getId());

        plan.setBatch(examination.getBatch());
        if (examination.getAcademicYear() != null) plan.setAcademicYear(examination.getAcademicYear().getYear());
        if (examination.getSemester() != null) plan.setSemester(examination.getSemester().getSemesterNumber().toString());
        List<String> eClasses = new ArrayList<>();
        if (examination.getClasses() != null) {
            for (com.acronexus.entity.AcroClass c : examination.getClasses()) {
                eClasses.add(c.getName() + (c.getSection() != null ? " " + c.getSection() : ""));
            }
        }
        plan.setClassName(String.join(", ", eClasses));

        plan.setTotalStudents(enrollments.size());
        plan.setRoomsUtilized(request.getRooms().size());
        
        int totalCap = request.getRooms().stream().mapToInt(r -> r.getBenches() * r.getMaxPerBench()).sum();
        plan.setTotalCapacity(totalCap);
        
        List<SeatingArrangementRoomDto> allocatedRooms = new ArrayList<>();
        
        int classIndex = 0;
        
        for (SeatingRoomConfigDto roomConfig : request.getRooms()) {
            SeatingArrangementRoomDto room = new SeatingArrangementRoomDto();
            room.setRoomNumber(roomConfig.getRoomNumber());
            room.setBenches(roomConfig.getBenches());
            room.setMaxPerBench(roomConfig.getMaxPerBench());
            room.setInvigilatorIds(roomConfig.getInvigilatorIds());
            room.setStudents(new ArrayList<>());
            
            Set<String> classesInRoom = new HashSet<>();
            int allocated = 0;
            int sno = 1;
            
            for (int r = 1; r <= roomConfig.getBenches(); r++) {
                for (int b = 1; b <= roomConfig.getMaxPerBench(); b++) {
                    String selectedClass = null;
                    StudentEnrollment selectedStudent = null;
                    
                    int attempts = 0;
                    while (attempts < classNames.size() && !classNames.isEmpty()) {
                        String currentClass = classNames.get(classIndex);
                        int ptr = classPointers.get(currentClass);
                        List<StudentEnrollment> classList = studentsByClass.get(currentClass);
                        
                        if (ptr < classList.size()) {
                            selectedClass = currentClass;
                            selectedStudent = classList.get(ptr);
                            classPointers.put(currentClass, ptr + 1);
                            classIndex = (classIndex + 1) % classNames.size();
                            break;
                        }
                        classIndex = (classIndex + 1) % classNames.size();
                        attempts++;
                    }
                    
                    if (selectedStudent != null) {
                        SeatingArrangementStudentDto studentDto = new SeatingArrangementStudentDto();
                        studentDto.setSno(sno++);
                        studentDto.setEnrollment(selectedStudent.getStudent().getEnrollmentNo());
                        String name = selectedStudent.getStudent().getUser().getFirstName();
                        if (selectedStudent.getStudent().getUser().getLastName() != null) {
                            name += " " + selectedStudent.getStudent().getUser().getLastName();
                        }
                        studentDto.setName(name);
                        studentDto.setClassName(selectedClass);
                        studentDto.setRow("R" + ((r - 1) / 5 + 1));
                        studentDto.setBench("B" + r);
                        studentDto.setSeat(b);
                        
                        room.getStudents().add(studentDto);
                        classesInRoom.add(selectedClass);
                        allocated++;
                    }
                }
            }
            room.setAllocated(allocated);
            room.setClasses(new ArrayList<>(classesInRoom));
            allocatedRooms.add(room);
        }
        
        plan.setRoomAllocations(allocatedRooms);
        
        int allocatedStudents = 0;
        for (SeatingArrangementRoomDto r : allocatedRooms) {
            allocatedStudents += r.getAllocated();
        }
        int unallocated = enrollments.size() - allocatedStudents;
        plan.setUnallocatedStudents(Math.max(0, unallocated));
        
        return plan;
    }

    @Override
    @Transactional
    public SeatingArrangementDto saveSeatingPlan(SeatingArrangementDto dto) {
        Examination examination = examinationRepository.findByIdAndIsDeletedFalse(dto.getExaminationId())
                .orElseThrow(() -> new ResourceNotFoundException("Examination not found"));

        Optional<SeatingArrangement> existing = seatingArrangementRepository.findByExaminationIdAndIsDeletedFalse(dto.getExaminationId());
        if (existing.isPresent()) {
            seatingArrangementRepository.delete(existing.get());
        }

        SeatingArrangement arrangement = new SeatingArrangement();
        arrangement.setExamination(examination);
        arrangement.setTotalStudents(dto.getTotalStudents());
        arrangement.setRoomsUtilized(dto.getRoomsUtilized());
        arrangement.setTotalCapacity(dto.getTotalCapacity());
        if (dto.getUnallocatedStudents() != null) {
            // Note: If SeatingArrangement entity doesn't have unallocatedStudents, we skip saving it.
            // Wait, SeatingArrangement entity might not have unallocatedStudents.
        }

        List<SeatingArrangementRoom> rooms = new ArrayList<>();
        for (SeatingArrangementRoomDto roomDto : dto.getRoomAllocations()) {
            SeatingArrangementRoom room = new SeatingArrangementRoom();
            room.setSeatingArrangement(arrangement);
            room.setRoomNumber(roomDto.getRoomNumber());
            room.setBenches(roomDto.getBenches());
            room.setMaxPerBench(roomDto.getMaxPerBench());
            room.setAllocated(roomDto.getAllocated());
            room.setClasses(String.join(",", roomDto.getClasses()));
            
            if (roomDto.getInvigilatorIds() != null && !roomDto.getInvigilatorIds().isEmpty()) {
                List<User> invigs = userRepository.findAllById(roomDto.getInvigilatorIds());
                room.setInvigilators(invigs);
            }
            
            List<SeatingArrangementStudent> students = new ArrayList<>();
            for (SeatingArrangementStudentDto studentDto : roomDto.getStudents()) {
                SeatingArrangementStudent student = new SeatingArrangementStudent();
                student.setRoom(room);
                student.setSno(studentDto.getSno());
                student.setRowNum(studentDto.getRow());
                student.setBenchNum(studentDto.getBench());
                student.setSeatNum(studentDto.getSeat());
                
                Student stu = studentRepository.findByEnrollmentNo(studentDto.getEnrollment())
                        .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
                student.setStudent(stu);
                
                students.add(student);
            }
            room.setStudents(students);
            rooms.add(room);
        }
        arrangement.setRoomAllocations(rooms);
        
        SeatingArrangement saved = seatingArrangementRepository.save(arrangement);
        dto.setId(saved.getId());
        return dto;
    }

    @Override
    public SeatingArrangementDto getSeatingPlan(UUID examinationId) {
        SeatingArrangement arrangement = seatingArrangementRepository.findByExaminationIdAndIsDeletedFalse(examinationId)
                .orElseThrow(() -> new ResourceNotFoundException("Seating arrangement not found"));

        SeatingArrangementDto dto = new SeatingArrangementDto();
        dto.setId(arrangement.getId());
        dto.setExaminationId(arrangement.getExamination().getId());

        dto.setBatch(arrangement.getExamination().getBatch());
        if (arrangement.getExamination().getAcademicYear() != null) dto.setAcademicYear(arrangement.getExamination().getAcademicYear().getYear());
        if (arrangement.getExamination().getSemester() != null) dto.setSemester(arrangement.getExamination().getSemester().getSemesterNumber().toString());
        List<String> eClasses = new ArrayList<>();
        if (arrangement.getExamination().getClasses() != null) {
            for (com.acronexus.entity.AcroClass c : arrangement.getExamination().getClasses()) {
                eClasses.add(c.getName() + (c.getSection() != null ? " " + c.getSection() : ""));
            }
        }
        dto.setClassName(String.join(", ", eClasses));

        dto.setTotalStudents(arrangement.getTotalStudents());
        dto.setRoomsUtilized(arrangement.getRoomsUtilized());
        dto.setTotalCapacity(arrangement.getTotalCapacity());

        List<SeatingArrangementRoomDto> roomDtos = new ArrayList<>();
        for (SeatingArrangementRoom room : arrangement.getRoomAllocations()) {
            SeatingArrangementRoomDto roomDto = new SeatingArrangementRoomDto();
            roomDto.setId(room.getId());
            roomDto.setRoomNumber(room.getRoomNumber());
            roomDto.setBenches(room.getBenches());
            roomDto.setMaxPerBench(room.getMaxPerBench());
            roomDto.setAllocated(room.getAllocated());
            roomDto.setClasses(Arrays.asList(room.getClasses().split(",")));
            
            if (room.getInvigilators() != null) {
                List<UUID> ids = new ArrayList<>();
                List<String> names = new ArrayList<>();
                for (User u : room.getInvigilators()) {
                    ids.add(u.getId());
                    String name = u.getFirstName();
                    if (u.getLastName() != null) name += " " + u.getLastName();
                    names.add(name);
                }
                roomDto.setInvigilatorIds(ids);
                roomDto.setInvigilatorNames(names);
            }
            
            List<SeatingArrangementStudentDto> studentDtos = new ArrayList<>();
            for (SeatingArrangementStudent student : room.getStudents()) {
                SeatingArrangementStudentDto studentDto = new SeatingArrangementStudentDto();
                studentDto.setId(student.getId());
                studentDto.setSno(student.getSno());
                studentDto.setEnrollment(student.getStudent().getEnrollmentNo());
                String name = student.getStudent().getUser().getFirstName();
                if (student.getStudent().getUser().getLastName() != null) {
                    name += " " + student.getStudent().getUser().getLastName();
                }
                studentDto.setName(name);
                studentDto.setClassName(roomDto.getClasses().get(0)); 
                studentDto.setRow(student.getRowNum());
                studentDto.setBench(student.getBenchNum());
                studentDto.setSeat(student.getSeatNum());
                studentDtos.add(studentDto);
            }
            
            for (SeatingArrangementStudentDto sDto : studentDtos) {
                StudentEnrollment e = studentEnrollmentRepository.findFirstByStudentIdAndIsActiveTrueOrderByCreatedAtDesc(
                        studentRepository.findByEnrollmentNo(sDto.getEnrollment()).get().getId()).orElse(null);
                if (e != null) {
                    String cname = e.getAcroClass().getName();
                    if (e.getAcroClass().getSection() != null && !e.getAcroClass().getSection().isEmpty()) {
                        cname = e.getAcroClass().getSection();
                    }
                    sDto.setClassName(cname);
                }
            }
            
            studentDtos.sort(Comparator.comparing(SeatingArrangementStudentDto::getSno));
            roomDto.setStudents(studentDtos);
            roomDtos.add(roomDto);
        }
        
        dto.setRoomAllocations(roomDtos);
        return dto;
    }

    @Override
    @Transactional
    public void deleteSeatingPlan(UUID examinationId) {
        SeatingArrangement arrangement = seatingArrangementRepository.findByExaminationIdAndIsDeletedFalse(examinationId)
                .orElseThrow(() -> new ResourceNotFoundException("Seating arrangement not found"));
        seatingArrangementRepository.delete(arrangement);
    }
}
