package com.inventory.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "bill_items")
public class BillItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bill_id")
    private Long billId;

    @Column(name = "design_name", nullable = false)
    private String designName;

    @Column(nullable = false)
    private String size;

    @Column(nullable = false)
    private String type;

    @Column(name = "quantity_boxes", nullable = false)
    private Integer quantityBoxes;

    @Column(name = "price_per_box", nullable = false)
    private Double pricePerBox;

    @Column(name = "total_price", nullable = false)
    private Double totalPrice;

    public BillItem() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getBillId() { return billId; }
    public void setBillId(Long billId) { this.billId = billId; }
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