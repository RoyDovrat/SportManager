package com.sportmanager.config;

import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Render scans for an open PORT before Spring Boot binds Tomcat (after JPA/Neon).
 * Hold the port on IPv4 during startup, then close it immediately before Tomcat starts.
 */
@Slf4j
public final class RenderPortPlaceholder {

    private static final AtomicReference<ServerSocket> SOCKET = new AtomicReference<>();

    private RenderPortPlaceholder() {
    }

    public static void startIfNeeded() {
        if (!shouldStart()) {
            return;
        }
        int port = Integer.parseInt(System.getenv("PORT").trim());
        try {
            ServerSocket serverSocket = new ServerSocket();
            serverSocket.setReuseAddress(true);
            serverSocket.bind(new InetSocketAddress("0.0.0.0", port));
            if (!SOCKET.compareAndSet(null, serverSocket)) {
                serverSocket.close();
                return;
            }
            Thread acceptor = new Thread(() -> acceptUntilClosed(serverSocket), "render-port-placeholder");
            acceptor.setDaemon(true);
            acceptor.start();
            log.info("Render port placeholder listening on 0.0.0.0:{}", port);
        } catch (IOException ex) {
            log.warn("Could not start Render port placeholder on {}", port, ex);
        }
    }

    public static void stop() {
        ServerSocket serverSocket = SOCKET.getAndSet(null);
        if (serverSocket == null) {
            return;
        }
        try {
            serverSocket.close();
        } catch (IOException ignored) {
            // Tomcat bind follows immediately.
        }
    }

    private static boolean shouldStart() {
        String port = System.getenv("PORT");
        String profiles = System.getenv("SPRING_PROFILES_ACTIVE");
        return port != null && !port.isBlank()
                && profiles != null && profiles.contains("render");
    }

    private static void acceptUntilClosed(ServerSocket serverSocket) {
        while (!serverSocket.isClosed()) {
            try (Socket ignored = serverSocket.accept()) {
                // TCP probes only. HTTP health checks retry until Tomcat is up.
            } catch (IOException ex) {
                if (serverSocket.isClosed()) {
                    return;
                }
            }
        }
    }
}
