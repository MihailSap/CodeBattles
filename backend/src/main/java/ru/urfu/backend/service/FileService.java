package ru.urfu.backend.service;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;

public interface FileService {

    String save(MultipartFile file);

    void delete(String fileName);

    Resource getFileResource(String fileTitle) throws MalformedURLException;
}
