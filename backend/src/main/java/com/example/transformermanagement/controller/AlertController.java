package com.example.transformermanagement.controller;

import com.example.transformermanagement.model.Alert;
import com.example.transformermanagement.service.AlertService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {
    @Autowired
    private AlertService alertService;

    @GetMapping
    public List<Alert> getAllAlerts() {
        return alertService.getAllAlerts();
    }

    @PostMapping
    public Alert createAlert(@RequestBody Alert alert) {
        return alertService.saveAlert(alert);
    }
}
