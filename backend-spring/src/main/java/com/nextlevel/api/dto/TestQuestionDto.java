package com.nextlevel.api.dto;

import java.util.List;

public class TestQuestionDto {
    private String id;
    private String examId;
    private String module;
    private String type;
    private String scenario;
    private List<String> options;
    private Integer chooseCount;

    public TestQuestionDto() {}

    public TestQuestionDto(String id, String examId, String module, String type, String scenario, List<String> options, Integer chooseCount) {
        this.id = id;
        this.examId = examId;
        this.module = module;
        this.type = type;
        this.scenario = scenario;
        this.options = options;
        this.chooseCount = chooseCount;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getExamId() { return examId; }
    public void setExamId(String examId) { this.examId = examId; }
    
    public String getModule() { return module; }
    public void setModule(String module) { this.module = module; }
    
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    
    public String getScenario() { return scenario; }
    public void setScenario(String scenario) { this.scenario = scenario; }
    
    public List<String> getOptions() { return options; }
    public void setOptions(List<String> options) { this.options = options; }
    
    public Integer getChooseCount() { return chooseCount; }
    public void setChooseCount(Integer chooseCount) { this.chooseCount = chooseCount; }
}
