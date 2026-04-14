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

    // ✅ FIXED: Use exact match (=) instead of LIKE '%...%'
    // The old LIKE query caused every stock item to appear "linked to bills"
    // because partial matches like "White" would match "Off-White Tiles" etc.
    @Query("SELECT DISTINCT b FROM Bill b JOIN b.items i WHERE LOWER(i.designName) = LOWER(:designName)")
    List<Bill> findBillsByDesignName(@Param("designName") String designName);
}