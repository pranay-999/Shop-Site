package com.inventory.model;

import jakarta.persistence.*;

@Entity
@Table(name = "bill_items")
public class BillItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bill_id", nullable = false)
    private Bill bill;
    
    @Column(nullable = false)
    private String designName;
    
    @Column(nullable = false)
    private String size;
    
    @Column(nullable = false)
    private String type;
    
    @Column(nullable = false)
    private Integer quantityBoxes;
    
    @Column(nullable = false)
    private Double pricePerBox;
    
    @Column(nullable = false)
    private Double totalPrice;

    public BillItem() {}

    public BillItem(Long id, Bill bill, String designName, String size, String type, Integer quantityBoxes, Double pricePerBox, Double totalPrice) {
        this.id = id;
        this.bill = bill;
        this.designName = designName;
        this.size = size;
        this.type = type;
        this.quantityBoxes = quantityBoxes;
        this.pricePerBox = pricePerBox;
        this.totalPrice = totalPrice;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Bill getBill() { return bill; }
    public void setBill(Bill bill) { this.bill = bill; }

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
