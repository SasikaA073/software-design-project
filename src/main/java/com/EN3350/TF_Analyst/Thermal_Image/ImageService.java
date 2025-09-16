package com.EN3350.TF_Analyst.Thermal_Image;

import com.EN3350.TF_Analyst.Inspection.Inspection;
import com.EN3350.TF_Analyst.Transformer.Transformer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

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

    private void verifyUploadRequest(Image imageMetaData){
        Long transformerId = imageMetaData.getTransformer().getId();
        Inspection inspection = imageMetaData.getInspection();
        Image.ImageType imageType = imageMetaData.getType();
        Image.WeatherCondition weatherCondition = imageMetaData.getWeatherCondition();

        // check for inspection image uploads without inspection specified
        if (inspection == null &&
                imageType == Image.ImageType.INSPECTION) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Inspection Id is Required for Inspection Images!");
        }
        // check for baseline image uploads with inspection attached
        if (imageType == Image.ImageType.BASELINE && inspection != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Inspection Id in Baseline Image is Not Allowed!");
        }

        // check (type + weather + inspection/transformer id) already exists
        if (imageType == Image.ImageType.BASELINE &&
                imageRepository.existsByTypeAndTransformerIdAndWeatherCondition(
                        Image.ImageType.BASELINE,
                        transformerId,
                        weatherCondition)){
             throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                     "A Baseline Image Already Exists for This Context!");
        }
        if (imageType == Image.ImageType.INSPECTION &&
                imageRepository.existsByInspectionIdAndWeatherCondition(
                        inspection.getId(),
                        weatherCondition)){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "An Inspection Image Already Exists for This Context!");
        }
    }

    public void deleteImageFile(Long id) {
        String path = imageRepository.getReferenceById(id).getPath();
        File file = new File(path);
        boolean delete = file.delete();
    }
}
