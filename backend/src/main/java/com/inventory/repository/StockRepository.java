package com.inventory.repository;

import com.inventory.model.Stock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StockRepository extends JpaRepository<Stock, Long> {
    
    Optional<Stock> findByDesignName(String designName);
    
    List<Stock> findByDesignNameContainingIgnoreCase(String designName);
    
    @Query("SELECT s FROM Stock s WHERE " +
           "s.designName LIKE %:search% OR " +
           "s.size LIKE %:search% OR " +
           "s.type LIKE %:search%")
    List<Stock> searchStocks(@Param("search") String search);
    
    @Query("SELECT s FROM Stock s WHERE s.totalBoxes <= :lowStockThreshold")
    List<Stock> findLowStockItems(@Param("lowStockThreshold") Integer threshold);
}
