package ru.urfu.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.urfu.backend.PathsConstants;
import ru.urfu.backend.config.StackData;

import java.util.Set;

@Tag(name = "Получение названий для стека")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.STACK)
public class StackController {

    private final StackData stackData;

    @Autowired
    public StackController(StackData stackData) {
        this.stackData = stackData;
    }

    @Operation(description = "Получение названий платформ и облаков")
    @GetMapping("/clouds")
    public Set<String> getClouds(){
        return stackData.getData().get("clouds");
    }

    @Operation(description = "Получение названий баз данных")
    @GetMapping("/databases")
    public Set<String> getDatabases(){
        return stackData.getData().get("databases");
    }

    @Operation(description = "Получение названий фреймворков и библиотек")
    @GetMapping("/frameworks")
    public Set<String> getFrameworks(){
        return stackData.getData().get("frameworks");
    }

    @Operation(description = "Получение названий языков программирования")
    @GetMapping("/languages")
    public Set<String> getLanguages(){
        return stackData.getData().get("languages");
    }

    @Operation(description = "Получение названий инструментов и технологий")
    @GetMapping("/tools")
    public Set<String> getTools(){
        return stackData.getData().get("tools");
    }
}
