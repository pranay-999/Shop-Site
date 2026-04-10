package com.inventory.repository;

import com.inventory.model.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {
    
    Optional<Bill> findByBillNumber(String billNumber);
    
    boolean existsByBillNumber(String billNumber);
    
    List<Bill> findByCustomerNameContainingIgnoreCase(String customerName);
    
    List<Bill> findByPhoneNumber(String phoneNumber);
    
    @Query("SELECT b FROM Bill b WHERE " +
           "b.billNumber LIKE %:search% OR " +
           "b.customerName LIKE %:search% OR " +
           "b.phoneNumber LIKE %:search%")
    List<Bill> searchBills(@Param("search") String search);
    
    @Query("SELECT b FROM Bill b WHERE b.createdAt >= :startDate AND b.createdAt <= :endDate")
    List<Bill> findBillsByDateRange(@Param("startDate") LocalDateTime startDate, 
                                     @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT b FROM Bill b WHERE DATE(b.createdAt) = CURDATE()")
    List<Bill> findTodaysBills();
}
