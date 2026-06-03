# Stage 1: Build the JAR file
FROM eclipse-temurin:22-jdk-alpine AS build
WORKDIR /app

# Copy gradle files
COPY gradle/ gradle/
COPY gradlew settings.gradle build.gradle ./

# Make gradlew executable
RUN chmod +x gradlew

# Copy source code
COPY src/ src/

# Build application without running tests
RUN ./gradlew build -x test --no-daemon

# Stage 2: Run the application
FROM eclipse-temurin:22-jre-alpine
WORKDIR /app

# Copy the JAR file from the build stage
COPY --from=build /app/build/libs/*-SNAPSHOT.jar app.jar

# Expose port 8080
EXPOSE 8080

# Run the app
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
