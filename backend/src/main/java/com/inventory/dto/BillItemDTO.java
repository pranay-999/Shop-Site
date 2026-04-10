package com.inventory.dto;

public class BillItemDTO {
    private Long id;
    private String designName;
    private String size;
    private String type;
    private Integer quantityBoxes;
    private Double pricePerBox;
    private Double totalPrice;

    public BillItemDTO() {}

    public BillItemDTO(Long id, String designName, String size, String type, Integer quantityBoxes, Double pricePerBox, Double totalPrice) {
        this.id = id;
        this.designName = designName;
        this.size = size;
        this.type = type;
        this.quantityBoxes = quantityBoxes;
        this.pricePerBox = pricePerBox;
        this.totalPrice = totalPrice;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDesignName() { return designName; }
    public void setDesignName(String designName) { this.designName = designName; }

    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Integer getQuantityBoxes() { return quantityBoxes; }
    public void setQuantityBoxes(Integer quantityBoxes) { this.quantityBoxes = quantityBoxes; }

    public Double getPricePerBox() { return pricePerBox; }
    public void setPricePerBox(Double pricePerBox) { this.pricePerBox = pricePerBox; }

    public Double getTotalPrice() { return totalPrice; }
    public void setTotalPrice(Double totalPrice) { this.totalPrice = totalPrice; }
}
