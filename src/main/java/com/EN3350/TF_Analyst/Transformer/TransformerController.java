package com.EN3350.TF_Analyst.Transformer;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/test")
public class TransformerController {

    private final TransformerService transformerService;

    @Autowired
    public  TransformerController(TransformerService transformerService){
        this.transformerService = transformerService;
    }

    @GetMapping
    public List<Transformer> getTransformers(){
        return transformerService.getTransformers();
    }

    @GetMapping("{id}")
    public Transformer getTransformerById(@PathVariable("id") Long id){
        return transformerService.getTransformerById(id);
    }

    @PostMapping
    public void Transformer(@RequestBody Transformer transformer){
        transformerService.addTransformer(transformer);
    }


}
