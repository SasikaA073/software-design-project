package com.EN3350.TF_Analyst.Thermal_Image;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("api/img")
public class ImageController {

    private final ImageService imageService;

    @Autowired
    public ImageController(ImageService imageService) {
        this.imageService = imageService;
    }

    @GetMapping("{id}")
    public Image getImage(@PathVariable Long id){
        return imageService.findById(id);
    }

    @PostMapping("/upload")
    public void uploadImage(
            @RequestPart("metadata") Image imageMetaData,
            @RequestPart("file") MultipartFile file) throws IOException {
        imageService.uploadImage(imageMetaData, file);

    }


}
