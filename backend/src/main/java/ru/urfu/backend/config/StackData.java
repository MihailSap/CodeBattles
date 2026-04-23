package ru.urfu.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.Map;
import java.util.Set;

@Configuration
@ConfigurationProperties(prefix = "stack")
public class StackData {

    private Map<String, Set<String>> data;

    public Map<String, Set<String>> getData() {
        return data;
    }

    public void setData(Map<String, Set<String>> data) {
        this.data = data;
    }
}
