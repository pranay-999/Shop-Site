package com.inventory.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "stocks", indexes = {
    @Index(name = "idx_stocks_design_name", columnList = "design_name"),
    @Index(name = "idx_stocks_category_id", columnList = "category_id")
})
public class Stock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String designName;

    @Column(nullable = false)
    private String size;

    @Column(nullable = false)
    private String type;

    @Column(nullable = true)
    private Integer initialBoxes;

    @Column(nullable = true)
    private Integer soldBoxes;

    @Column(nullable = false)
    private Integer totalBoxes;

    @Column(nullable = false)
    private Double pricePerBox;

    @Column(nullable = false)
    private Long categoryId;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public Stock() {}

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.soldBoxes == null) this.soldBoxes = 0;
        if (this.initialBoxes == null) this.initialBoxes = this.totalBoxes;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDesignName() { return designName; }
    public void setDesignName(String designName) { this.designName = designName; }

    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Integer getInitialBoxes() { return initialBoxes == null ? 0 : initialBoxes; }
    public void setInitialBoxes(Integer initialBoxes) { this.initialBoxes = initialBoxes; }

    public Integer getSoldBoxes() { return soldBoxes == null ? 0 : soldBoxes; }
    public void setSoldBoxes(Integer soldBoxes) { this.soldBoxes = soldBoxes; }

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
