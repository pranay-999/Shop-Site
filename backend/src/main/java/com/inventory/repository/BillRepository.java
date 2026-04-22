package com.inventory.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.inventory.model.Bill;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {
    Optional<Bill> findByBillNumber(String billNumber);
    boolean existsByBillNumber(String billNumber);
    List<Bill> findByCustomerNameContainingIgnoreCase(String customerName);
    List<Bill> findByPhoneNumber(String phoneNumber);
    List<Bill> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    /**
     * Returns all bills where any item's designName exactly matches (case-insensitive).
     * Uses exact match to avoid false positives from partial substring matches.
     */
    @Query("SELECT DISTINCT b FROM Bill b JOIN b.items i WHERE LOWER(i.designName) = LOWER(:designName)")
    List<Bill> findBillsByDesignName(@Param("designName") String designName);

    /**
     * Gets the highest numeric suffix across all bill numbers (e.g. "INV-20260101-007" → 7).
     * Used to generate the next bill number without loading all bills into memory.
     */
    @Query("SELECT MAX(CAST(SUBSTRING(b.billNumber, LENGTH(b.billNumber) - 2, 3) AS integer)) FROM Bill b WHERE b.billNumber LIKE 'INV-%'")
    Integer findMaxBillSequence();
}
