package com.acronexus.controller;

import com.acronexus.dto.ApiResponse;
import com.acronexus.dto.UserRequestDto;
import com.acronexus.dto.UserResponseDto;
import com.acronexus.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping({"/api/users", "/api/v1/users"})
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping
    public ResponseEntity<ApiResponse<UserResponseDto>> createUser(@Valid @RequestBody UserRequestDto requestDto) {
        UserResponseDto createdUser = userService.createUser(requestDto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User created successfully", createdUser));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponseDto>> getUserById(@PathVariable UUID id) {
        UserResponseDto user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success("User fetched successfully", user));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponseDto>>> getAllUsers() {
        List<UserResponseDto> users = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.success("Users fetched successfully", users));
    }

    @GetMapping("/invigilators")
    public ResponseEntity<ApiResponse<List<UserResponseDto>>> getInvigilators() {
        List<UserResponseDto> invigilators = userService.getInvigilators();
        return ResponseEntity.ok(ApiResponse.success("Invigilators fetched successfully", invigilators));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable UUID id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("User deleted successfully", null));
    }

    @DeleteMapping("/faculty/all")
    public ResponseEntity<ApiResponse<Void>> deleteAllFaculty() {
        userService.deleteAllFaculty();
        return ResponseEntity.ok(ApiResponse.success("All faculty records deleted successfully", null));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD')")
    public ResponseEntity<ApiResponse<UserResponseDto>> updateUser(@PathVariable UUID id, @RequestBody Map<String, Object> updates) {
        UserResponseDto updatedUser = userService.updateUser(id, updates);
        return ResponseEntity.ok(ApiResponse.success("User role and details updated successfully", updatedUser));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD')")
    public ResponseEntity<ApiResponse<UserResponseDto>> patchUser(@PathVariable UUID id, @RequestBody Map<String, Object> updates) {
        UserResponseDto updatedUser = userService.updateUser(id, updates);
        return ResponseEntity.ok(ApiResponse.success("User role and details updated successfully", updatedUser));
    }
}
