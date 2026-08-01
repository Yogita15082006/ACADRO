package com.acronexus.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class FaviconController {

    @GetMapping(value = {"/favicon.ico", "/*/favicon.ico", "/**/favicon.ico"})
    public ResponseEntity<Void> favicon() {
        return ResponseEntity.noContent().build();
    }
}
