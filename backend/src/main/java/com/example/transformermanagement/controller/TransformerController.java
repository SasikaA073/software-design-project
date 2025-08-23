package com.example.transformermanagement.controller;

import com.example.transformermanagement.model.Transformer;
import com.example.transformermanagement.service.TransformerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/transformers")
public class TransformerController {
    @Autowired
    private TransformerService transformerService;

    @GetMapping
    public List<Transformer> getAllTransformers() {
        return transformerService.getAllTransformers();
    }

    @GetMapping("/{id}")
    public Optional<Transformer> getTransformerById(@PathVariable java.util.UUID id) {
        return transformerService.getTransformerById(id);
    }

    @PostMapping
    public Transformer createTransformer(@RequestBody Transformer transformer) {
        return transformerService.saveTransformer(transformer);
    }

    @PutMapping("/{id}")
    public Transformer updateTransformer(@PathVariable java.util.UUID id, @RequestBody Transformer transformerDetails) {
        Transformer transformer = transformerService.getTransformerById(id).orElseThrow();
        transformer.setTransformerNo(transformerDetails.getTransformerNo());
        transformer.setPoleNo(transformerDetails.getPoleNo());
        transformer.setRegion(transformerDetails.getRegion());
        transformer.setType(transformerDetails.getType());
        transformer.setLocationDetails(transformerDetails.getLocationDetails());
        transformer.setCapacity(transformerDetails.getCapacity());
        transformer.setNoOfFeeders(transformerDetails.getNoOfFeeders());
        return transformerService.saveTransformer(transformer);
    }

    @DeleteMapping("/{id}")
    public void deleteTransformer(@PathVariable java.util.UUID id) {
        transformerService.deleteTransformer(id);
    }
}
