package com.sportmanager.config;

import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.boot.web.servlet.server.ConfigurableServletWebServerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("render")
public class RenderWebServerHandoffConfig {

    @Bean
    public WebServerFactoryCustomizer<ConfigurableServletWebServerFactory> releasePlaceholderBeforeTomcat() {
        return factory -> RenderPortPlaceholder.stop();
    }
}
