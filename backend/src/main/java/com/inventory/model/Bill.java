package com.inventory.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "bills")
public class Bill {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String billNumber;
    
    @Column(nullable = false)
    private String customerName;
    
    @Column(nullable = false)
    private String phoneNumber;
    
    @Column(nullable = false)
    private Double subtotal;
    
    @Column(nullable = false)
    private Double gstAmount;
    
    @Column(nullable = false)
    private Double gstRate;
    
    @Column(nullable = false)
    private String gstType; // EXCLUSIVE or INCLUSIVE
    
    @Column(nullable = false)
    private Double discount;
    
    @Column(nullable = false)
    private Double totalAmount;
    
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "bill", orphanRemoval = true)
    private List<BillItem> items;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public Bill() {}

    public Bill(Long id, String billNumber, String customerName, String phoneNumber, Double subtotal, Double gstAmount, Double gstRate, String gstType, Double discount, Double totalAmount, List<BillItem> items, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.billNumber = billNumber;
        this.customerName = customerName;
        this.phoneNumber = phoneNumber;
        this.subtotal = subtotal;
        this.gstAmount = gstAmount;
        this.gstRate = gstRate;
        this.gstType = gstType;
        this.discount = discount;
        this.totalAmount = totalAmount;
        this.items = items;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getBillNumber() { return billNumber; }
    public void setBillNumber(String billNumber) { this.billNumber = billNumber; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public Double getSubtotal() { return subtotal; }
    public void setSubtotal(Double subtotal) { this.subtotal = subtotal; }

    public Double getGstAmount() { return gstAmount; }
    public void setGstAmount(Double gstAmount) { this.gstAmount = gstAmount; }

    public Double getGstRate() { return gstRate; }
    public void setGstRate(Double gstRate) { this.gstRate = gstRate; }

    public String getGstType() { return gstType; }
    public void setGstType(String gstType) { this.gstType = gstType; }

    public Double getDiscount() { return discount; }
    public void setDiscount(Double discount) { this.discount = discount; }

    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }

    public List<BillItem> getItems() { return items; }
    public void setItems(List<BillItem> items) { this.items = items; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
