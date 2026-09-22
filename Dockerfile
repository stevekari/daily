# syntax=docker/dockerfile:1

# Stage 1: Build Frontend React SPA
FROM node:20-alpine AS frontend-build
WORKDIR /workspace/frontend

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

COPY frontend/ .
ARG VITE_API_URL=""
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# Stage 2: Build Backend Spring Boot with embedded Frontend Assets
FROM maven:3.9.9-eclipse-temurin-25-alpine AS backend-build
WORKDIR /workspace/backend

COPY backend/pom.xml .
COPY backend/src ./src
COPY --from=frontend-build /workspace/frontend/dist ./src/main/resources/static

RUN mvn clean package -DskipTests -Dmaven.test.skip=true

# Stage 3: Production Runtime Container with Java 25 JRE
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

# Ensure storage directory for persistent H2 database
RUN mkdir -p /app/data

COPY --from=backend-build /workspace/backend/target/app.jar /app/app.jar

ENV PORT=8080
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-8080} -Dserver.address=0.0.0.0 -Xms128m -Xmx320m -XX:+UseSerialGC -jar /app/app.jar"]
