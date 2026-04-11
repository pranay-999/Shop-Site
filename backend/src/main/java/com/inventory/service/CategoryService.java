package com.inventory.service;

import com.inventory.dto.CategoryDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class CategoryService {

    private static final Logger log = LoggerFactory.getLogger(CategoryService.class);

    private final Map<Long, CategoryDTO> categories = new ConcurrentHashMap<>();
    private final AtomicLong idGenerator = new AtomicLong(1);

    public List<CategoryDTO> getAllCategories() {
        return categories.values().stream()
                .sorted(Comparator.comparing(CategoryDTO::getId))
                .toList();
    }

    public CategoryDTO getCategoryById(Long id) {
        CategoryDTO category = categories.get(id);
        if (category == null) {
            throw new RuntimeException("Category not found with id: " + id);
        }
        return category;
    }

    public CategoryDTO getCategoryBySlug(String slug) {
        return categories.values().stream()
                .filter(category -> category.getCategorySlug() != null
                        && category.getCategorySlug().equalsIgnoreCase(slug))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Category not found with slug: " + slug));
    }

    public CategoryDTO createCategory(CategoryDTO categoryDTO) {
        LocalDateTime now = LocalDateTime.now();
        Long id = categoryDTO.getId() != null ? categoryDTO.getId() : idGenerator.getAndIncrement();
        CategoryDTO saved = new CategoryDTO(
                id,
                categoryDTO.getCategoryName(),
                categoryDTO.getCategorySlug(),
                categoryDTO.getDescription(),
                categoryDTO.getIcon(),
                categoryDTO.getColorCode(),
                categoryDTO.getCreatedAt() != null ? categoryDTO.getCreatedAt() : now,
                now
        );
        categories.put(id, saved);
        return saved;
    }

    public void initializeDefaultCategories() {
        if (!categories.isEmpty()) {
            return;
        }

        List<CategoryDTO> defaults = new ArrayList<>();
        defaults.add(new CategoryDTO(null, "Tiles", "tiles", "Ceramic, Porcelain, Marble, Granite tiles", "square", "#3B82F6", null, null));
        defaults.add(new CategoryDTO(null, "Electronics", "electronics", "Electronic items and appliances", "lightbulb", "#F59E0B", null, null));
        defaults.add(new CategoryDTO(null, "Sanitary Ware", "sanitary-ware", "Bathroom fixtures and sanitary products", "droplet", "#10B981", null, null));
        defaults.add(new CategoryDTO(null, "Faucets & Fixtures", "faucets", "Water faucets and bathroom fixtures", "wrench", "#8B5CF6", null, null));
        defaults.add(new CategoryDTO(null, "Hardware", "hardware", "Building hardware and accessories", "hammer", "#EF4444", null, null));
        defaults.add(new CategoryDTO(null, "Other", "other", "Miscellaneous products", "cube", "#6B7280", null, null));

        defaults.forEach(this::createCategory);
        log.info("Initialized {} in-memory default categories. Persistence mode: in-memory (no JDBC).", categories.size());
    }
}
