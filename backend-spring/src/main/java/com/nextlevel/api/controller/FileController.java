package com.nextlevel.api.controller;

import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.nextlevel.api.dto.ApiResponse;
import com.nextlevel.api.model.StudyFile;
import com.nextlevel.api.repository.StudyFileRepository;
import com.nextlevel.api.security.CurrentUser;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private final StudyFileRepository studyFileRepository;

    public FileController(StudyFileRepository studyFileRepository) {
        this.studyFileRepository = studyFileRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<StudyFile>>> list(@AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String fileType,
            @RequestParam(required = false) String search) {
        List<StudyFile> files = studyFileRepository.findByUserIdAndIsArchivedNotOrderByIsPinnedDescCreatedAtDesc(currentUser.getUserId(), true)
                .stream()
                .filter(f -> category == null || "all".equals(category) || category.equals(f.getCategory()))
                .filter(f -> fileType == null || "all".equals(fileType) || fileType.equals(f.getFileType()))
                .filter(f -> search == null || contains(f.getTitle(), search) || contains(f.getFileName(), search)
                        || contains(f.getSummary(), search)
                        || (f.getTags() != null && f.getTags().stream().anyMatch(t -> contains(t, search))))
                .map(this::withoutFileData)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(files));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<StudyFile>> upload(@AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String category) {
        try {
            if (file.isEmpty()) return ResponseEntity.badRequest().body(ApiResponse.error("No file uploaded"));
            if (file.getSize() > 10L * 1024L * 1024L) {
                return ResponseEntity.badRequest().body(ApiResponse.error("File too large. Max 10MB."));
            }

            String mimeType = file.getContentType() == null ? "application/octet-stream" : file.getContentType();
            String base64 = Base64.getEncoder().encodeToString(file.getBytes());
            String dataUri = "data:" + mimeType + ";base64," + base64;

            StudyFile sf = new StudyFile();
            sf.setUserId(currentUser.getUserId());
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

            StudyFile saved = studyFileRepository.save(sf);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(withoutFileData(saved)));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.error("Failed to upload file"));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StudyFile>> get(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable String id) {
        StudyFile file = studyFileRepository.findByIdAndUserId(id, currentUser.getUserId()).orElse(null);
        if (file == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("File not found"));
        return ResponseEntity.ok(ApiResponse.success(file));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<StudyFile>> patch(@AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String id,
            @org.springframework.web.bind.annotation.RequestBody Map<String, Object> body) {
        StudyFile file = studyFileRepository.findByIdAndUserId(id, currentUser.getUserId()).orElse(null);
        if (file == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("File not found"));

        if (body.containsKey("title")) file.setTitle(strOr(body.get("title"), file.getTitle()));
        if (body.containsKey("category")) file.setCategory(strOr(body.get("category"), file.getCategory()));
        if (body.containsKey("summary")) file.setSummary(strOr(body.get("summary"), file.getSummary()));
        if (body.containsKey("tags") && body.get("tags") instanceof List<?> l) file.setTags(l.stream().map(String::valueOf).toList());
        if (body.containsKey("isPinned")) file.setIsPinned(boolOr(body.get("isPinned"), file.getIsPinned()));
        if (body.containsKey("isArchived")) file.setIsArchived(boolOr(body.get("isArchived"), file.getIsArchived()));
        file.setUpdatedAt(Instant.now());

        return ResponseEntity.ok(ApiResponse.success(withoutFileData(studyFileRepository.save(file))));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable String id) {
        StudyFile file = studyFileRepository.findByIdAndUserId(id, currentUser.getUserId()).orElse(null);
        if (file == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("File not found"));
        studyFileRepository.delete(file);
        return ResponseEntity.ok(ApiResponse.message("File deleted"));
    }

    private StudyFile withoutFileData(StudyFile input) {
        StudyFile copy = new StudyFile();
        copy.setUserId(input.getUserId());
        copy.setFileName(input.getFileName());
        copy.setFileType(input.getFileType());
        copy.setMimeType(input.getMimeType());
        copy.setFileSize(input.getFileSize());
        copy.setTitle(input.getTitle());
        copy.setSummary(input.getSummary());
        copy.setCategory(input.getCategory());
        copy.setTags(input.getTags());
        copy.setIsPinned(input.getIsPinned());
        copy.setIsArchived(input.getIsArchived());
        copy.setCreatedAt(input.getCreatedAt());
        copy.setUpdatedAt(input.getUpdatedAt());
        try {
            var setId = StudyFile.class.getDeclaredMethod("setId", String.class);
            setId.invoke(copy, input.getId());
        } catch (Exception ignored) {
        }
        return copy;
    }

    private String detectType(String mimeType) {
        if ("application/pdf".equals(mimeType)) return "pdf";
        if (mimeType.startsWith("image/")) return "image";
        if (mimeType.contains("word") || mimeType.contains("document")) return "doc";
        if (mimeType.contains("sheet") || mimeType.contains("excel")) return "spreadsheet";
        return "other";
    }

    private boolean contains(String src, String q) { return src != null && src.toLowerCase().contains(q.toLowerCase()); }
    private String strOr(Object value, String fallback) { return value == null ? fallback : value.toString(); }
    private Boolean boolOr(Object value, Boolean fallback) {
        if (value == null) return fallback;
        if (value instanceof Boolean b) return b;
        String text = value.toString();
        return Boolean.parseBoolean(text);
    }
}
