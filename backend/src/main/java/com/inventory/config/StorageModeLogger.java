package com.inventory.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class StorageModeLogger implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(StorageModeLogger.class);

    @Value("${app.storage.mode:in-memory}")
    private String storageMode;

    @Override
    public void run(ApplicationArguments args) {
        log.info("Backend storage mode: {}", storageMode);
        log.info("Database auto-configuration is disabled. No JDBC/Hikari connections will be created.");
    }
}
