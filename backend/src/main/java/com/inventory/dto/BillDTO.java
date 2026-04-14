package com.inventory.dto;

import java.time.LocalDateTime;
import java.util.List;

public class BillDTO {
    private Long id;
    private String billNumber;
    private String customerName;
    private String phoneNumber;
    private Double subtotal;
    private Double gstAmount;
    private Double gstRate;
    private String gstType;
    private Double discount;
    private Double totalAmount;
    private List<BillItemDTO> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isEdited;
    private LocalDateTime editedAt;

    // Each entry is a full snapshot of the bill BEFORE an edit was made
    // Ordered oldest-first so index 0 = original bill, last index = version just before current
    private List<BillSnapshotDTO> editHistory;

    public BillDTO() {}

    public BillDTO(Long id, String billNumber, String customerName, String phoneNumber,
                   Double subtotal, Double gstAmount, Double gstRate, String gstType,
                   Double discount, Double totalAmount, List<BillItemDTO> items,
                   LocalDateTime createdAt, LocalDateTime updatedAt,
                   Boolean isEdited, LocalDateTime editedAt,
                   List<BillSnapshotDTO> editHistory) {
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
        this.isEdited = isEdited;
        this.editedAt = editedAt;
        this.editHistory = editHistory;
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
    public List<BillItemDTO> getItems() { return items; }
    public void setItems(List<BillItemDTO> items) { this.items = items; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public Boolean getIsEdited() { return isEdited != null && isEdited; }
    public void setIsEdited(Boolean isEdited) { this.isEdited = isEdited; }
    public LocalDateTime getEditedAt() { return editedAt; }
    public void setEditedAt(LocalDateTime editedAt) { this.editedAt = editedAt; }
    public List<BillSnapshotDTO> getEditHistory() { return editHistory; }
    public void setEditHistory(List<BillSnapshotDTO> editHistory) { this.editHistory = editHistory; }
}