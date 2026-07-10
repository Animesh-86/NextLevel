package com.nextlevel.api.service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;

import com.nextlevel.api.model.Capture;
import com.nextlevel.api.model.Question;
import com.nextlevel.api.repository.CaptureRepository;
import com.nextlevel.api.repository.QuestionRepository;

@Service
public class ImportProcessingService {

    private final QuestionRepository questionRepository;
    private final CaptureRepository captureRepository;
    private final AIQuestionGeneratorService aiQuestionGeneratorService;

    public ImportProcessingService(QuestionRepository questionRepository, CaptureRepository captureRepository, AIQuestionGeneratorService aiQuestionGeneratorService) {
        this.questionRepository = questionRepository;
        this.captureRepository = captureRepository;
        this.aiQuestionGeneratorService = aiQuestionGeneratorService;
    }

    public void processTextImport(String text, String examId, String moduleName, String userId) {
        List<Question> generated = aiQuestionGeneratorService.generateQuestions(text, examId, moduleName);
        saveGeneratedQuestions(generated, userId);
    }

    public void processFileImport(byte[] bytes, String fileName, String examId, String moduleName, String userId) {
        try {
            List<Question> parsed = new ArrayList<>();
            if (fileName.endsWith(".csv")) {
                parsed.addAll(parseCsv(bytes, examId));
            } else if (fileName.endsWith(".zip")) {
                // Parse Obsidian Markdown Vault to Captures instead of questions
                processZipImport(bytes, userId);
                return;
            } else if (fileName.endsWith(".pdf")) {
                try (PDDocument document = Loader.loadPDF(bytes)) {
                    PDFTextStripper stripper = new PDFTextStripper();
                    String content = stripper.getText(document);
                    parsed.addAll(aiQuestionGeneratorService.generateQuestions(content, examId, moduleName));
                }
            } else if (fileName.endsWith(".txt") || fileName.endsWith(".docx")) {
                String content = new String(bytes, StandardCharsets.UTF_8);
                parsed.addAll(aiQuestionGeneratorService.generateQuestions(content, examId, moduleName));
            }
            saveGeneratedQuestions(parsed, userId);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void saveGeneratedQuestions(List<Question> questions, String userId) {
        if (questions == null || questions.isEmpty()) {
            return;
        }
        for (Question q : questions) {
            q.setUserId(userId);
            questionRepository.save(q);
        }
    }

    private void processZipImport(byte[] zipBytes, String userId) {
        try (java.io.ByteArrayInputStream bais = new java.io.ByteArrayInputStream(zipBytes);
             ZipInputStream zis = new ZipInputStream(bais)) {
            
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if (!entry.isDirectory() && entry.getName().endsWith(".md")) {
                    String title = entry.getName();
                    // Strip path and .md
                    int lastSlash = title.lastIndexOf('/');
                    if (lastSlash != -1) title = title.substring(lastSlash + 1);
                    if (title.endsWith(".md")) title = title.substring(0, title.length() - 3);

                    String content = new String(zis.readAllBytes(), StandardCharsets.UTF_8);
                    
                    Capture capture = new Capture();
                    capture.setUserId(userId);
                    capture.setTitle(title);
                    capture.setRawContent(content);
                    capture.setType("note");
                    capture.setStatus("active");
                    captureRepository.save(capture);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private List<Question> parseCsv(byte[] bytes, String examId) throws Exception {
        List<Question> out = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(new java.io.ByteArrayInputStream(bytes), StandardCharsets.UTF_8))) {
            String header = br.readLine();
            if (header == null) return out;
            String line;
            while ((line = br.readLine()) != null) {
                String[] c = line.split(",");
                if (c.length < 3) continue;
                Question q = new Question();
                q.setExamId(examId);
                q.setModule(c[0]);
                q.setScenario(c[1]);
                List<String> options = new ArrayList<>();
                for (int i = 2; i < c.length - 1; i++) {
                    if (!c[i].isBlank()) options.add(c[i]);
                }
                q.setOptions(options);
                String ansStr = c[c.length - 1];
                List<Integer> ans = new ArrayList<>();
                if (ansStr.contains(";")) {
                    for (String a : ansStr.split(";")) {
                        ans.add(Integer.parseInt(a.trim()));
                    }
                } else {
                    ans.add(Integer.parseInt(ansStr.trim()));
                }
                q.setAnswer(ans);
                q.setType(ans.size() > 1 ? "MSQ" : "MCQ");
                q.setChooseCount(ans.size());
                out.add(q);
            }
        }
        return out;
    }
}
