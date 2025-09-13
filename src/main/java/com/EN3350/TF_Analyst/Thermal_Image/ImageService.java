package com.EN3350.TF_Analyst.Thermal_Image;

import com.EN3350.TF_Analyst.Inspection.Inspection;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Service
public class ImageService {
    private final ImageRepository imageRepository;

    @Value("${app.image.storage-path}")
    private String storagePath;

    @Autowired
    public ImageService(ImageRepository imageRepository) {
        this.imageRepository = imageRepository;
    }

    public Image findById(Long id) {
        return imageRepository.findById(id).get();
    }


    public void uploadImage(Image imageMetaData, MultipartFile file) throws IOException {

        String folder = storagePath;
        System.out.println(folder);

        String  transformerId = imageMetaData.getTransformer().getTransformerNo();

        Inspection inspection = imageMetaData.getInspection();


        folder += "/transformer/" + transformerId;

        if (inspection != null) {
            folder += "/inspections/" + inspection.getInspectionNo();
        } else {
            folder += "/baseline";
        }
        File dir = new File(folder);
        if (!dir.exists()) {
            boolean mkdirs = dir.mkdirs();
        }

        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();

        System.out.println(fileName);
        System.out.println(dir.getAbsolutePath());
//        File destination = new File(dir, fileName);
        Path destination = Paths.get(dir.getAbsolutePath(), fileName);
        System.out.println(destination.toString());
        file.transferTo(destination);

        imageMetaData.setPath(destination.toString());
        imageMetaData.setUploadDate(LocalDate.now());
        imageMetaData.setUploadTime(LocalTime.now());
//        imageMetaData.setUpload;

        imageRepository.save(imageMetaData);
    }

    public void deleteImageFile(Long id) {
        String path = imageRepository.getReferenceById(id).getPath();
        File file = new File(path);
        boolean delete = file.delete();
    }
}
