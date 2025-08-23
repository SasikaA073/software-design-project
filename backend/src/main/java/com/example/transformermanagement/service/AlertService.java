package com.example.transformermanagement.service;

import com.example.transformermanagement.model.Alert;
import com.example.transformermanagement.repository.AlertRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AlertService {
    @Autowired
    private AlertRepository alertRepository;

    public List<Alert> getAllAlerts() {
        return alertRepository.findAll();
    }

    public Alert saveAlert(Alert alert) {
        return alertRepository.save(alert);
    }
}
