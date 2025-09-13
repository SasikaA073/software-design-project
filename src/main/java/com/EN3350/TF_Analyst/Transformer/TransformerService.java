package com.EN3350.TF_Analyst.Transformer;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TransformerService {

    private final TransformerRepository transformerRepository;

    @Autowired
    public TransformerService(TransformerRepository transformerRepository) {
        this.transformerRepository = transformerRepository;
    }

    public List<Transformer> getTransformers(){
        return transformerRepository.findAll();
    }

    public void addTransformer(Transformer transformer) {
        transformerRepository.save(transformer);
    }

    public Transformer getTransformerById(Long id) {
        Optional<Transformer> optional = transformerRepository.findById(id);
        if(optional.isPresent()) {
            return transformerRepository.getReferenceById(id);
        }else{
            throw new IllegalStateException("Transformer with id " + id + " not found");
        }
    }

}
