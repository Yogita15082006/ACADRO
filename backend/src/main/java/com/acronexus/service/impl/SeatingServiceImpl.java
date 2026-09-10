package com.acronexus.service.impl;

import com.acronexus.dto.seating.*;
import com.acronexus.entity.*;
import com.acronexus.exception.ResourceNotFoundException;
import com.acronexus.repository.*;
import com.acronexus.service.SeatingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigInteger;
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

    private static class SectionQueue {
        UUID acroClassId;
        String parentIdentity;
        String displayClassName;
        List<StudentEnrollment> students = new ArrayList<>();
        int pointer = 0;

        boolean isExhausted() {
            return pointer >= students.size();
        }

        StudentEnrollment next() {
            return students.get(pointer++);
        }
    }

    private static int compareAlphanumeric(String s1, String s2) {
        if (s1 == null && s2 == null) return 0;
        if (s1 == null) return -1;
        if (s2 == null) return 1;

        int thisMarker = 0;
        int thatMarker = 0;
        int s1Length = s1.length();
        int s2Length = s2.length();

        while (thisMarker < s1Length && thatMarker < s2Length) {
            String thisChunk = getChunk(s1, s1Length, thisMarker);
            thisMarker += thisChunk.length();

            String thatChunk = getChunk(s2, s2Length, thatMarker);
            thatMarker += thatChunk.length();

            int result = 0;
            if (isDigit(thisChunk.charAt(0)) && isDigit(thatChunk.charAt(0))) {
                try {
                    BigInteger b1 = new BigInteger(thisChunk);
                    BigInteger b2 = new BigInteger(thatChunk);
                    result = b1.compareTo(b2);
                } catch (Exception e) {
                    result = thisChunk.compareTo(thatChunk);
                }
            } else {
                result = thisChunk.compareToIgnoreCase(thatChunk);
            }

            if (result != 0) {
                return result;
            }
        }
        return s1Length - s2Length;
    }

    private static String getChunk(String s, int slength, int marker) {
        StringBuilder chunk = new StringBuilder();
        char c = s.charAt(marker);
        chunk.append(c);
        marker++;
        if (isDigit(c)) {
            while (marker < slength) {
                c = s.charAt(marker);
                if (!isDigit(c)) break;
                chunk.append(c);
                marker++;
            }
        } else {
            while (marker < slength) {
                c = s.charAt(marker);
                if (isDigit(c)) break;
                chunk.append(c);
                marker++;
            }
        }
        return chunk.toString();
    }

    private static boolean isDigit(char ch) {
        return ch >= '0' && ch <= '9';
    }

    @Override
    public SeatingArrangementDto generateSeatingPlan(SeatingGenerateRequestDto request) {
        Examination examination = examinationRepository.findByIdAndIsDeletedFalse(request.getExaminationId())
                .orElseThrow(() -> new ResourceNotFoundException("Examination not found"));

        List<ExaminationEligibilityList> lists = eligibilityListRepository.findByExaminationIdOrderByCreatedAtDesc(request.getExaminationId());
        if (lists.isEmpty()) throw new ResourceNotFoundException("Eligibility list not found for examination");
        ExaminationEligibilityList eligibilityList = lists.get(0);
        List<StudentEnrollment> enrollments = new ArrayList<>();
        for (ExaminationEligibilityStudent ees : eligibilityList.getStudents()) {
            if (Boolean.TRUE.equals(ees.getIsEligible())) {
                studentEnrollmentRepository.findFirstByStudentIdAndIsActiveTrueOrderByCreatedAtDesc(ees.getStudent().getId())
                    .ifPresent(enrollments::add);
            }
        }

        Map<UUID, SectionQueue> queuesMap = new HashMap<>();
        for (StudentEnrollment enrollment : enrollments) {
            AcroClass ac = enrollment.getAcroClass();
            if (ac == null) continue;

            if (ac.getDegreeProgram() == null || ac.getDepartment() == null || ac.getName() == null) {
                throw new IllegalStateException("Student enrollment " + enrollment.getStudent().getEnrollmentNo() + " belongs to an incomplete class. Anti-cheating validation impossible.");
            }

            UUID id = ac.getId();
            SectionQueue q = queuesMap.computeIfAbsent(id, k -> {
                SectionQueue sq = new SectionQueue();
                sq.acroClassId = id;
                sq.parentIdentity = ac.getDegreeProgram().getId().toString() + "-" +
                                    ac.getDepartment().getId().toString() + "-" +
                                    ac.getName().trim().toLowerCase();
                String section = ac.getSection();
                sq.displayClassName = (section != null && !section.isEmpty()) ? section.trim() : ac.getName().trim();
                return sq;
            });
            q.students.add(enrollment);
        }

        List<SectionQueue> allQueues = new ArrayList<>(queuesMap.values());
        allQueues.sort(Comparator.comparing(q -> q.displayClassName)); // Deterministic order

        for (SectionQueue q : allQueues) {
            q.students.sort(Comparator.comparing(
                (StudentEnrollment e) -> e.getStudent().getEnrollmentNo(),
                SeatingServiceImpl::compareAlphanumeric
            ));
        }

        SeatingArrangementDto plan = new SeatingArrangementDto();
        plan.setExaminationId(examination.getId());
        plan.setBatch(examination.getBatch());
        if (examination.getAcademicYear() != null) plan.setAcademicYear(examination.getAcademicYear().getYear());
        if (examination.getSemester() != null) plan.setSemester(examination.getSemester().getSemesterNumber().toString());
        List<String> eClasses = new ArrayList<>();
        if (examination.getClasses() != null) {
            for (AcroClass c : examination.getClasses()) {
                eClasses.add((c.getSection() != null && !c.getSection().isEmpty()) ? c.getSection().trim() : c.getName().trim());
            }
        }
        plan.setClassName(String.join(", ", eClasses));
        plan.setTotalStudents(enrollments.size());
        plan.setRoomsUtilized(request.getRooms().size());

        int totalCap = request.getRooms().stream().mapToInt(r -> r.getBenches() * r.getMaxPerBench()).sum();
        plan.setTotalCapacity(totalCap);

        List<SeatingArrangementRoomDto> allocatedRooms = new ArrayList<>();
        Map<Integer, SectionQueue> activeQueuesBySeat = new HashMap<>();
        
        int globalSno = 1;

        for (SeatingRoomConfigDto roomConfig : request.getRooms()) {
            SeatingArrangementRoomDto room = new SeatingArrangementRoomDto();
            room.setRoomNumber(roomConfig.getRoomNumber());
            room.setBenches(roomConfig.getBenches());
            room.setMaxPerBench(roomConfig.getMaxPerBench());
            room.setInvigilatorIds(roomConfig.getInvigilatorIds());
            if (roomConfig.getInvigilatorIds() != null && !roomConfig.getInvigilatorIds().isEmpty()) {
                java.util.List<com.acronexus.entity.User> invigs = userRepository.findAllById(roomConfig.getInvigilatorIds());
                java.util.List<String> names = new java.util.ArrayList<>();
                for (com.acronexus.entity.User u : invigs) {
                    String name = u.getFirstName();
                    if (u.getLastName() != null) name += " " + u.getLastName();
                    names.add(name);
                }
                room.setInvigilatorNames(names);
            }
            room.setStartTime(roomConfig.getStartTime());
            room.setEndTime(roomConfig.getEndTime());
            room.setStudents(new ArrayList<>());
            
            Set<String> classesInRoom = new HashSet<>();
            int allocated = 0;
            
            for (int r = 1; r <= roomConfig.getBenches(); r++) {
                Set<String> benchParentIdentities = new HashSet<>();
                
                for (int b = 1; b <= roomConfig.getMaxPerBench(); b++) {
                    SectionQueue candidateQueue = activeQueuesBySeat.get(b);
                    
                    boolean isValid = candidateQueue != null && !candidateQueue.isExhausted() && !benchParentIdentities.contains(candidateQueue.parentIdentity);
                    
                    if (!isValid) {
                        candidateQueue = null;
                        for (SectionQueue q : allQueues) {
                            if (!q.isExhausted() && !benchParentIdentities.contains(q.parentIdentity)) {
                                candidateQueue = q;
                                activeQueuesBySeat.put(b, q);
                                break;
                            }
                        }
                    }
                    
                    if (candidateQueue != null) {
                        StudentEnrollment selectedStudent = candidateQueue.next();
                        SeatingArrangementStudentDto studentDto = new SeatingArrangementStudentDto();
                        studentDto.setSno(globalSno++);
                        studentDto.setEnrollment(selectedStudent.getStudent().getEnrollmentNo());
                        String name = selectedStudent.getStudent().getUser().getFirstName();
                        if (selectedStudent.getStudent().getUser().getLastName() != null) {
                            name += " " + selectedStudent.getStudent().getUser().getLastName();
                        }
                        studentDto.setName(name);
                        studentDto.setClassName(candidateQueue.displayClassName);
                        // Isolate visual row convention
                        studentDto.setRow("R" + ((r - 1) / 5 + 1));
                        studentDto.setBench("B" + r);
                        studentDto.setSeat(b);
                        
                        room.getStudents().add(studentDto);
                        benchParentIdentities.add(candidateQueue.parentIdentity);
                        classesInRoom.add(candidateQueue.displayClassName);
                        allocated++;
                    }
                }
            }
            room.setAllocated(allocated);
            room.setClasses(new ArrayList<>(classesInRoom));
            allocatedRooms.add(room);
        }
        
        plan.setRoomAllocations(allocatedRooms);
        int unallocated = allQueues.stream().mapToInt(q -> q.students.size() - q.pointer).sum();
        plan.setUnallocatedStudents(Math.max(0, unallocated));
        
        validateArrangement(plan, enrollments, queuesMap);

        return plan;
    }

    private void validateArrangement(SeatingArrangementDto plan, List<StudentEnrollment> enrollments, Map<UUID, SectionQueue> queuesMap) {
        Set<String> placedEnrollments = new HashSet<>();
        
        for (SeatingArrangementRoomDto room : plan.getRoomAllocations()) {
            Set<String> usedSeats = new HashSet<>();
            Map<String, Set<String>> benchParentIdentities = new HashMap<>();
            
            for (SeatingArrangementStudentDto student : room.getStudents()) {
                String seatKey = room.getRoomNumber() + "-" + student.getBench() + "-" + student.getSeat();
                if (!usedSeats.add(seatKey)) {
                    throw new IllegalStateException("Seat assigned twice: " + seatKey);
                }
                
                if (!placedEnrollments.add(student.getEnrollment())) {
                    throw new IllegalStateException("Student duplicated: " + student.getEnrollment());
                }
                
                StudentEnrollment enrollment = enrollments.stream()
                    .filter(e -> e.getStudent().getEnrollmentNo().equals(student.getEnrollment()))
                    .findFirst().orElseThrow(() -> new IllegalStateException("Unknown student generated: " + student.getEnrollment()));
                
                AcroClass ac = enrollment.getAcroClass();
                String parentId = ac.getDegreeProgram().getId().toString() + "-" + ac.getDepartment().getId().toString() + "-" + ac.getName().trim().toLowerCase();
                
                String benchKey = room.getRoomNumber() + "-" + student.getBench();
                Set<String> benchIdentities = benchParentIdentities.computeIfAbsent(benchKey, k -> new HashSet<>());
                if (!benchIdentities.add(parentId)) {
                    throw new IllegalStateException("Anti-cheating violation on bench: " + benchKey + " (Multiple students from parent group: " + ac.getName() + ")");
                }
            }
        }
        
        if (placedEnrollments.size() != enrollments.size()) {
            throw new IllegalStateException("Insufficient capacity or impossible anti-cheating constraints. Expected " + enrollments.size() + " but seated " + placedEnrollments.size());
        }
        
        for (SectionQueue q : queuesMap.values()) {
            int pointer = 0;
            for (SeatingArrangementRoomDto room : plan.getRoomAllocations()) {
                for (SeatingArrangementStudentDto student : room.getStudents()) {
                    StudentEnrollment e = enrollments.stream().filter(en -> en.getStudent().getEnrollmentNo().equals(student.getEnrollment())).findFirst().get();
                    if (e.getAcroClass().getId().equals(q.acroClassId)) {
                        String expectedEnrollment = q.students.get(pointer).getStudent().getEnrollmentNo();
                        if (!student.getEnrollment().equals(expectedEnrollment)) {
                            throw new IllegalStateException("Enrollment sequence violated in section " + q.displayClassName + ". Expected " + expectedEnrollment + " but got " + student.getEnrollment());
                        }
                        pointer++;
                    }
                }
            }
        }
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

        List<SeatingArrangementRoom> rooms = new ArrayList<>();
        for (SeatingArrangementRoomDto roomDto : dto.getRoomAllocations()) {
            SeatingArrangementRoom room = new SeatingArrangementRoom();
            room.setSeatingArrangement(arrangement);
            room.setRoomNumber(roomDto.getRoomNumber());
            room.setBenches(roomDto.getBenches());
            room.setMaxPerBench(roomDto.getMaxPerBench());
            room.setAllocated(roomDto.getAllocated());
            room.setClasses(String.join(",", roomDto.getClasses()));
            room.setStartTime(roomDto.getStartTime());
            room.setEndTime(roomDto.getEndTime());
            
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
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
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
                eClasses.add((c.getSection() != null && !c.getSection().isEmpty()) ? c.getSection().trim() : c.getName().trim());
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
            roomDto.setStartTime(room.getStartTime());
            roomDto.setEndTime(room.getEndTime());
            
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
                studentDto.setStudentId(student.getStudent().getId());
                studentDtos.add(studentDto);
            }
            
            for (SeatingArrangementStudentDto sDto : studentDtos) {
                StudentEnrollment e = studentEnrollmentRepository.findFirstByStudentIdAndIsActiveTrueOrderByCreatedAtDesc(
                        studentRepository.findByEnrollmentNo(sDto.getEnrollment()).get().getId()).orElse(null);
                if (e != null) {
                    String cname = (e.getAcroClass().getSection() != null && !e.getAcroClass().getSection().isEmpty()) ? e.getAcroClass().getSection().trim() : e.getAcroClass().getName().trim();
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
