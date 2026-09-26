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
# 512 MB instance: SerialGC + IPv4 so Render's port scanner can see Tomcat.
ENV JAVA_OPTS="-Xms32m -Xmx160m -XX:+UseSerialGC -Xss512k -XX:MaxMetaspaceSize=96m -Djava.net.preferIPv4Stack=true"
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
