# Stage 1: Build
FROM maven:3.9.6-eclipse-temurin-21-jammy AS build
WORKDIR /app

# Copy pom.xml and download dependencies to leverage Docker cache
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build the application
COPY src ./src
RUN mvn clean package -DskipTests -B

# Rename the fat jar to a known name
RUN find target -maxdepth 1 -name '*.jar' -not -name '*original*' | head -1 | xargs -I{} cp {} target/app.jar

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Copy the renamed jar from the build stage
COPY --from=build /app/target/app.jar app.jar

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
