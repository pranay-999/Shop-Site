package com.inventory.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * Stores a full snapshot of a bill BEFORE it was edited.
 * Each time a bill is updated, the old version is saved here as JSON.
 * This lets us show a complete "before/after" edit history in the UI.
 */
@Entity
@Table(name = "bill_history")
public class BillHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bill_id", nullable = false)
    private Bill bill;

    // When this snapshot was saved (= when the edit happened)
    @Column(name = "snapshot_at", nullable = false)
    private LocalDateTime snapshotAt;

    // Optional note about what changed
    @Column(name = "edit_note", nullable = true, length = 500)
    private String editNote;

    // The entire old bill state serialized as a JSON string
    @Column(name = "snapshot_json", nullable = false, columnDefinition = "TEXT")
    private String snapshotJson;

    public BillHistory() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Bill getBill() { return bill; }
    public void setBill(Bill bill) { this.bill = bill; }

    public LocalDateTime getSnapshotAt() { return snapshotAt; }
    public void setSnapshotAt(LocalDateTime snapshotAt) { this.snapshotAt = snapshotAt; }

    public String getEditNote() { return editNote; }
    public void setEditNote(String editNote) { this.editNote = editNote; }

    public String getSnapshotJson() { return snapshotJson; }
    public void setSnapshotJson(String snapshotJson) { this.snapshotJson = snapshotJson; }
}