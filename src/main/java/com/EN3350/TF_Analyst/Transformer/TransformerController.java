package com.EN3350.TF_Analyst.Transformer;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/test")
public class TransformerController {
    @GetMapping
    public Transformer getTransformers(){
        Transformer transformer = new Transformer( "Kotte", "z001", Transformer.TransformerType.BULK, "Near the Junction");
        System.out.println(transformer);
        return transformer;
    }
}
