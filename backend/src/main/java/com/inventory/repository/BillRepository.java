package com.inventory.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.inventory.model.Bill;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {
    Optional<Bill> findByBillNumber(String billNumber);
    boolean existsByBillNumber(String billNumber);
    List<Bill> findByCustomerNameContainingIgnoreCase(String customerName);
    List<Bill> findByPhoneNumber(String phoneNumber);
    List<Bill> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}