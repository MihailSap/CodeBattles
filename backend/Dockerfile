FROM maven:3.9.9-eclipse-temurin-21-alpine AS build

WORKDIR /build

COPY pom.xml .

RUN mvn -B -Dmaven.test.skip=true dependency:go-offline

COPY src ./src

RUN mvn -B -Dmaven.test.skip=true package

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

RUN addgroup -S app \
    && adduser -S app -G app \
    && mkdir -p /app/uploads \
    && chown -R app:app /app

COPY --from=build /build/target/*.jar app.jar

USER app

EXPOSE 8080
VOLUME ["/app/uploads"]

ENTRYPOINT ["java", "-jar", "app.jar"]
