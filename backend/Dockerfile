# Render Free Web Service (512 MB). Build context: backend/
FROM maven:3.9.9-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S spring && adduser -S spring -G spring
COPY --from=build /app/target/sportmanager-backend-0.0.1-SNAPSHOT.jar app.jar
RUN chown spring:spring app.jar
USER spring
ENV SPRING_PROFILES_ACTIVE=render
ENV JAVA_OPTS="-Xms64m -Xmx256m"
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
