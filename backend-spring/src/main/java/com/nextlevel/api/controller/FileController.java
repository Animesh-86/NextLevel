package com.nextlevel.api.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.annotation.JsonView;
import com.nextlevel.api.dto.ApiResponse;
import com.nextlevel.api.dto.FilePatchRequest;
import com.nextlevel.api.model.StudyFile;
import com.nextlevel.api.model.Views;
import com.nextlevel.api.security.CurrentUser;
import com.nextlevel.api.service.FileService;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    @JsonView(Views.Public.class)
    @GetMapping
    public ResponseEntity<ApiResponse<List<StudyFile>>> list(@AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String fileType,
            @RequestParam(required = false) String search) {
        List<StudyFile> files = fileService.listFiles(currentUser.getUserId(), category, fileType, search);
        return ResponseEntity.ok(ApiResponse.success(files));
    }

    @JsonView(Views.Public.class)
    @PostMapping
    public ResponseEntity<ApiResponse<StudyFile>> upload(@AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String category) {
        try {
            StudyFile sf = fileService.uploadFile(currentUser.getUserId(), file, title, category);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(sf));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.error("Failed to upload file"));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StudyFile>> get(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable String id) {
        return fileService.getFile(id, currentUser.getUserId())
                .map(f -> ResponseEntity.ok(ApiResponse.success(f)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("File not found")));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<org.springframework.core.io.Resource> download(
            @AuthenticationPrincipal CurrentUser currentUser, 
            @PathVariable String id,
            @RequestParam(defaultValue = "false") boolean inline) {
        return fileService.getFile(id, currentUser.getUserId()).map(f -> {
            try {
                if (f.getFilePath() == null) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).<org.springframework.core.io.Resource>build();
                }
                java.nio.file.Path path = java.nio.file.Paths.get(f.getFilePath());
                org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(path.toUri());
                if (resource.exists() || resource.isReadable()) {
                    String disposition = inline ? "inline" : "attachment";
                    return ResponseEntity.ok()
                            .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, disposition + "; filename=\"" + f.getFileName() + "\"")
                            .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, f.getMimeType())
                            .body(resource);
                } else {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).<org.springframework.core.io.Resource>build();
                }
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).<org.springframework.core.io.Resource>build();
            }
        }).orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @JsonView(Views.Public.class)
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<StudyFile>> patch(@AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String id,
            @Validated @RequestBody FilePatchRequest request) {
        return fileService.patchFile(id, currentUser.getUserId(), request)
                .map(f -> ResponseEntity.ok(ApiResponse.success(f)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("File not found")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable String id) {
        fileService.deleteFile(id, currentUser.getUserId());
        return ResponseEntity.ok(ApiResponse.message("File deleted"));
    }
}
