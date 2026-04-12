package com.inventory.repository;

import com.inventory.model.Stock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StockRepository extends JpaRepository<Stock, Long> {
    // Spring auto-generates SQL: SELECT * FROM stocks WHERE design_name = ?
    Optional<Stock> findByDesignNameIgnoreCase(String designName);

    // Spring auto-generates: SELECT * FROM stocks WHERE total_boxes < ?
    List<Stock> findByTotalBoxesLessThan(Integer threshold);

    // Search by any of these fields containing the search term
    List<Stock> findByDesignNameContainingIgnoreCaseOrSizeContainingIgnoreCaseOrTypeContainingIgnoreCase(
        String designName, String size, String type
    );

    long countByTotalBoxesLessThan(Integer threshold);
}