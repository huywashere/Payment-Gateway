# syntax=docker/dockerfile:1.7
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /workspace/backend-core
COPY backend-core/.mvn .mvn
COPY backend-core/mvnw backend-core/pom.xml ./
RUN chmod +x mvnw && ./mvnw -B -DskipTests dependency:go-offline

COPY backend-core/src src
RUN ./mvnw -B -DskipTests package

FROM eclipse-temurin:21-jre-alpine AS runtime

RUN addgroup -S gateway && adduser -S gateway -G gateway
WORKDIR /app

COPY --from=builder --chown=gateway:gateway /workspace/backend-core/target/*.jar /app/app.jar

USER gateway
EXPOSE 8080

ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
