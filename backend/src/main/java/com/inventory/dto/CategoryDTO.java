package com.inventory.dto;

import java.time.LocalDateTime;

public class CategoryDTO {
    private Long id;
    private String categoryName;
    private String categorySlug;
    private String description;
    private String icon;
    private String colorCode;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public CategoryDTO() {}

    public CategoryDTO(Long id, String categoryName, String categorySlug, String description, String icon, String colorCode, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.categoryName = categoryName;
        this.categorySlug = categorySlug;
        this.description = description;
        this.icon = icon;
        this.colorCode = colorCode;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public String getCategorySlug() { return categorySlug; }
    public void setCategorySlug(String categorySlug) { this.categorySlug = categorySlug; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public String getColorCode() { return colorCode; }
    public void setColorCode(String colorCode) { this.colorCode = colorCode; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
