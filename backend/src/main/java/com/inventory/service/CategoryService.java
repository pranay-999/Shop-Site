package com.inventory.service;

import com.inventory.dto.CategoryDTO;
import com.inventory.model.Category;
import com.inventory.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CategoryService {
    
    private final CategoryRepository categoryRepository;
    
    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }
    
    public List<CategoryDTO> getAllCategories() {
        return categoryRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @SuppressWarnings("null")
    public CategoryDTO getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        return convertToDTO(category);
    }
    
    public CategoryDTO getCategoryBySlug(String slug) {
        Category category = categoryRepository.findByCategorySlug(slug)
                .orElseThrow(() -> new RuntimeException("Category not found with slug: " + slug));
        return convertToDTO(category);
    }
    
    @SuppressWarnings("null")
    public CategoryDTO createCategory(CategoryDTO categoryDTO) {
        Category category = convertToEntity(categoryDTO);
        Category savedCategory = categoryRepository.save(category);
        return convertToDTO(savedCategory);
    }
    
    public void initializeDefaultCategories() {
        if (categoryRepository.count() == 0) {
            createCategory(new CategoryDTO(null, "Tiles", "tiles", "Ceramic, Porcelain, Marble, Granite tiles", "square", "#3B82F6", null, null));
            createCategory(new CategoryDTO(null, "Electronics", "electronics", "Electronic items and appliances", "lightbulb", "#F59E0B", null, null));
            createCategory(new CategoryDTO(null, "Sanitary Ware", "sanitary-ware", "Bathroom fixtures and sanitary products", "droplet", "#10B981", null, null));
            createCategory(new CategoryDTO(null, "Faucets & Fixtures", "faucets", "Water faucets and bathroom fixtures", "wrench", "#8B5CF6", null, null));
            createCategory(new CategoryDTO(null, "Hardware", "hardware", "Building hardware and accessories", "hammer", "#EF4444", null, null));
            createCategory(new CategoryDTO(null, "Other", "other", "Miscellaneous products", "cube", "#6B7280", null, null));
        }
    }
    
    private CategoryDTO convertToDTO(Category category) {
        return new CategoryDTO(
                category.getId(),
                category.getCategoryName(),
                category.getCategorySlug(),
                category.getDescription(),
                category.getIcon(),
                category.getColorCode(),
                category.getCreatedAt(),
                category.getUpdatedAt()
        );
    }
    
    private Category convertToEntity(CategoryDTO categoryDTO) {
        return new Category(
                categoryDTO.getId(),
                categoryDTO.getCategoryName(),
                categoryDTO.getCategorySlug(),
                categoryDTO.getDescription(),
                categoryDTO.getIcon(),
                categoryDTO.getColorCode(),
                null,
                null
        );
    }
}
