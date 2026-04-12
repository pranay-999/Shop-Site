package com.inventory.service;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import com.inventory.dto.CategoryDTO;
import com.inventory.model.Category;
import com.inventory.repository.CategoryRepository;

@Service
public class CategoryService {

    private static final Logger log = LoggerFactory.getLogger(CategoryService.class);
    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    private CategoryDTO toDTO(Category c) {
        return new CategoryDTO(c.getId(), c.getCategoryName(), c.getCategorySlug(),
            c.getDescription(), c.getIcon(), c.getColorCode(), c.getCreatedAt(), c.getUpdatedAt());
    }

    public List<CategoryDTO> getAllCategories() {
        return categoryRepository.findAll().stream().map(this::toDTO).toList();
    }

    public CategoryDTO getCategoryById(@NonNull Long id) {
        return toDTO(categoryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Category not found: " + id)));
    }

    public CategoryDTO getCategoryBySlug(String slug) {
        return toDTO(categoryRepository.findByCategorySlugIgnoreCase(slug)
            .orElseThrow(() -> new RuntimeException("Category not found: " + slug)));
    }

    public CategoryDTO createCategory(CategoryDTO dto) {
        Category c = new Category();
        c.setCategoryName(dto.getCategoryName());
        c.setCategorySlug(dto.getCategorySlug());
        c.setDescription(dto.getDescription());
        c.setIcon(dto.getIcon());
        c.setColorCode(dto.getColorCode());
        return toDTO(categoryRepository.save(c));
    }

    // Called on startup — only inserts if table is empty
    public void initializeDefaultCategories() {
        if (categoryRepository.count() > 0) {
            log.info("Categories already exist in database, skipping seed.");
            return;
        }
        log.info("Seeding default categories into database...");
        List<CategoryDTO> defaults = List.of(
            new CategoryDTO(null, "Tiles",             "tiles",         "Ceramic, Porcelain, Marble, Granite tiles", "square",   "#3B82F6", null, null),
            new CategoryDTO(null, "Electronics",       "electronics",   "Electronic items",                          "lightbulb","#F59E0B", null, null),
            new CategoryDTO(null, "Sanitary Ware",     "sanitary-ware", "Bathroom fixtures",                         "droplet",  "#10B981", null, null),
            new CategoryDTO(null, "Faucets & Fixtures","faucets",       "Water faucets",                             "wrench",   "#8B5CF6", null, null),
            new CategoryDTO(null, "Hardware",          "hardware",      "Building hardware",                         "hammer",   "#EF4444", null, null),
            new CategoryDTO(null, "Other",             "other",         "Miscellaneous",                             "cube",     "#6B7280", null, null)
        );
        defaults.forEach(this::createCategory);
        log.info("Seeded {} categories.", defaults.size());
    }
}