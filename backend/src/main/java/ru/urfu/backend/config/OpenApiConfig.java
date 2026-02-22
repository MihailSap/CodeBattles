package ru.urfu.backend.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;

@OpenAPIDefinition(
        info = @Info(
                title = "CodeBattles",
                description = "Платформа для peer-to-peer код ревью с элементами геймификации",
                version = "1.0.0"
        )
)
public class OpenApiConfig {
}
