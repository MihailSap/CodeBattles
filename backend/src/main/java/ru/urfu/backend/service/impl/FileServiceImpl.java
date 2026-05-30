package ru.urfu.backend.service.impl;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import ru.urfu.backend.service.FileService;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class FileServiceImpl implements FileService {

    public final String uploadDir = System.getProperty("user.dir") + File.separator + "uploads";

    private static final int MAX_WIDTH = 1200;

    private static final float IMAGE_QUALITY = 0.1f;

    public FileServiceImpl() {
        try {
            Files.createDirectories(Paths.get(uploadDir));
        } catch (IOException e) {
            throw new RuntimeException("Не удалось создать директорию для загрузки файлов", e);
        }
    }

    @Override
    public String save(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }
        try {
            Files.createDirectories(Paths.get(uploadDir));
            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            File targetFile = new File(uploadDir, fileName);
            file.transferTo(targetFile);
            System.out.println("Saving file to: " + targetFile.getAbsolutePath());
            return fileName;
        } catch (IOException e) {
            throw new RuntimeException("Ошибка при сохранении файла", e);
        }
    }

    @Override
    public void delete(String fileName) {
        if (fileName == null || fileName.isEmpty()) {
            return;
        }
        try {
            var filePath = Paths.get(uploadDir, fileName);
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            throw new RuntimeException("Ошибка при удалении файла", e);
        }
    }

    @Override
    public Resource getFileResource(String fileTitle) throws MalformedURLException {
        Path path = Paths.get(String.format("uploads/%s", fileTitle));
        return new UrlResource(path.toUri());
    }
}
