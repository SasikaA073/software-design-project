package com.EN3350.TF_Analyst.Thermal_Image;

import jakarta.persistence.PreRemove;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

import java.io.File;

@Component
public class ImageEntityListener {
//    @Autowired
//    private ImageService imageService;
//
//    @TransactionalEventListener
//    public void handleDelete(EntityDeletedEvent<Image> event) {
//        imageService.deleteImageFile(event.getEntity().getFilePath());
//    }
    @PreRemove
    public void preRemove(Image image) {
        File file = new File(image.getPath());
        if (!file.exists() || !file.delete()) {
            System.err.println("Failed to delete file: " + image.getPath());
        }
    }
}
