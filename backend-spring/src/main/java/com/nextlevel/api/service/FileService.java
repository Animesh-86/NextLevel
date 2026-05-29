package com.nextlevel.api.service;

import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.nextlevel.api.dto.FilePatchRequest;
import com.nextlevel.api.model.StudyFile;
import com.nextlevel.api.repository.StudyFileRepository;

@Service
public class FileService {

    private static final Logger log = LoggerFactory.getLogger(FileService.class);
    private final StudyFileRepository studyFileRepository;

    public FileService(StudyFileRepository studyFileRepository) {
        this.studyFileRepository = studyFileRepository;
    }

    public List<StudyFile> listFiles(String userId, String category, String fileType, String search) {
        log.info("Listing files for user: {}", userId);
        return studyFileRepository.findByUserIdAndIsArchivedNotOrderByIsPinnedDescCreatedAtDesc(userId, true)
                .stream()
                .filter(f -> category == null || "all".equals(category) || category.equals(f.getCategory()))
                .filter(f -> fileType == null || "all".equals(fileType) || fileType.equals(f.getFileType()))
                .filter(f -> search == null || containsIgnoreCase(f.getTitle(), search) || containsIgnoreCase(f.getFileName(), search)
                        || containsIgnoreCase(f.getSummary(), search)
                        || (f.getTags() != null && f.getTags().stream().anyMatch(t -> containsIgnoreCase(t, search))))
                .toList();
    }

    public StudyFile uploadFile(String userId, MultipartFile file, String title, String category) throws Exception {
        log.info("Uploading file for user: {}", userId);
        if (file.isEmpty()) throw new IllegalArgumentException("No file uploaded");
        if (file.getSize() > 10L * 1024L * 1024L) {
            throw new IllegalArgumentException("File too large. Max 10MB.");
        }

        String mimeType = file.getContentType() == null ? "application/octet-stream" : file.getContentType();
        String base64 = Base64.getEncoder().encodeToString(file.getBytes());
        String dataUri = "data:" + mimeType + ";base64," + base64;

        StudyFile sf = new StudyFile();
        sf.setUserId(userId);
        sf.setFileName(file.getOriginalFilename());
        sf.setFileType(detectType(mimeType));
        sf.setMimeType(mimeType);
        sf.setFileSize(file.getSize());
        sf.setFileData(dataUri);
        sf.setTitle(title == null || title.isBlank() ? file.getOriginalFilename() : title);
        sf.setSummary("");
        sf.setCategory(category == null ? "other" : category);
        sf.setCreatedAt(Instant.now());
        sf.setUpdatedAt(Instant.now());

        return studyFileRepository.save(sf);
    }

    public Optional<StudyFile> getFile(String id, String userId) {
        return studyFileRepository.findByIdAndUserId(id, userId);
    }

    public Optional<StudyFile> patchFile(String id, String userId, FilePatchRequest request) {
        log.info("Patching file {} for user {}", id, userId);
        return studyFileRepository.findByIdAndUserId(id, userId).map(file -> {
            if (request.title() != null) file.setTitle(request.title());
            if (request.category() != null) file.setCategory(request.category());
            if (request.summary() != null) file.setSummary(request.summary());
            if (request.tags() != null) file.setTags(request.tags());
            if (request.isPinned() != null) file.setIsPinned(request.isPinned());
            if (request.isArchived() != null) file.setIsArchived(request.isArchived());
            file.setUpdatedAt(Instant.now());
            return studyFileRepository.save(file);
        });
    }

    public void deleteFile(String id, String userId) {
        log.info("Deleting file {} for user {}", id, userId);
        studyFileRepository.findByIdAndUserId(id, userId).ifPresent(studyFileRepository::delete);
    }

    private String detectType(String mimeType) {
        if ("application/pdf".equals(mimeType)) return "pdf";
        if (mimeType.startsWith("image/")) return "image";
        if (mimeType.contains("word") || mimeType.contains("document")) return "doc";
        if (mimeType.contains("sheet") || mimeType.contains("excel")) return "spreadsheet";
        return "other";
    }

    private boolean containsIgnoreCase(String src, String q) {
        return src != null && src.toLowerCase().contains(q.toLowerCase());
    }
}
