package com.inventory.config;

import com.inventory.service.CategoryService;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer {
    
    private final CategoryService categoryService;
    
    public DataInitializer(CategoryService categoryService) {
        this.categoryService = categoryService;
    }
    
    @EventListener(ContextRefreshedEvent.class)
    public void initializeData() {
        categoryService.initializeDefaultCategories();
    }
}
