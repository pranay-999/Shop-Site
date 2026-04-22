package com.inventory.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class StorageModeLogger implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(StorageModeLogger.class);

    @Override
    public void run(ApplicationArguments args) {
        log.info("StockFlow backend started — storage: PostgreSQL (Supabase)");
    }
}
