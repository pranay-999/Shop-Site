package com.inventory.dto;

import java.time.LocalDateTime;

public class StockDTO {
    private Long id;
    private String designName;
    private String size;
    private String type;
    private Integer totalBoxes;
    private Double pricePerBox;
    private Long categoryId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public StockDTO() {}

    public StockDTO(Long id, String designName, String size, String type, Integer totalBoxes, Double pricePerBox, Long categoryId, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.designName = designName;
        this.size = size;
        this.type = type;
        this.totalBoxes = totalBoxes;
        this.pricePerBox = pricePerBox;
        this.categoryId = categoryId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDesignName() { return designName; }
    public void setDesignName(String designName) { this.designName = designName; }

    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Integer getTotalBoxes() { return totalBoxes; }
    public void setTotalBoxes(Integer totalBoxes) { this.totalBoxes = totalBoxes; }

    public Double getPricePerBox() { return pricePerBox; }
    public void setPricePerBox(Double pricePerBox) { this.pricePerBox = pricePerBox; }

    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
