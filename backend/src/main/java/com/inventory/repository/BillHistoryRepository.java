package com.inventory.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.inventory.model.BillHistory;

public interface BillHistoryRepository extends JpaRepository<BillHistory, Long> {

    // Get all history snapshots for a bill, oldest first
    List<BillHistory> findByBillIdOrderBySnapshotAtAsc(Long billId);
}