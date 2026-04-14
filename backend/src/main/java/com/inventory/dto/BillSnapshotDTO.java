package com.inventory.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Represents one historical version of a bill (what it looked like BEFORE an edit).
 * Sent to the frontend as part of BillDTO.editHistory[].
 */
public class BillSnapshotDTO {

    private LocalDateTime snapshotAt;   // when this version was saved
    private String editNote;            // optional note about the edit

    // Full bill data at the time of this snapshot
    private String customerName;
    private String phoneNumber;
    private Double subtotal;
    private Double gstRate;
    private String gstType;
    private Double gstAmount;
    private Double discount;
    private Double totalAmount;
    private List<BillItemDTO> items;

    public BillSnapshotDTO() {}

    public LocalDateTime getSnapshotAt() { return snapshotAt; }
    public void setSnapshotAt(LocalDateTime snapshotAt) { this.snapshotAt = snapshotAt; }
    public String getEditNote() { return editNote; }
    public void setEditNote(String editNote) { this.editNote = editNote; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public Double getSubtotal() { return subtotal; }
    public void setSubtotal(Double subtotal) { this.subtotal = subtotal; }
    public Double getGstRate() { return gstRate; }
    public void setGstRate(Double gstRate) { this.gstRate = gstRate; }
    public String getGstType() { return gstType; }
    public void setGstType(String gstType) { this.gstType = gstType; }
    public Double getGstAmount() { return gstAmount; }
    public void setGstAmount(Double gstAmount) { this.gstAmount = gstAmount; }
    public Double getDiscount() { return discount; }
    public void setDiscount(Double discount) { this.discount = discount; }
    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }
    public List<BillItemDTO> getItems() { return items; }
    public void setItems(List<BillItemDTO> items) { this.items = items; }
}