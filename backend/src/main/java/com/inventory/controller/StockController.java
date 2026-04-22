package com.inventory.controller;

import com.inventory.dto.StockDTO;
import com.inventory.service.StockService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/stocks")
public class StockController {

    private final StockService stockService;

    public StockController(StockService stockService) {
        this.stockService = stockService;
    }

    @GetMapping
    public ResponseEntity<List<StockDTO>> getAllStocks() {
        return ResponseEntity.ok(stockService.getAllStocks());
    }

    @GetMapping("/{id}")
    public ResponseEntity<StockDTO> getStockById(@PathVariable Long id) {
        return ResponseEntity.ok(stockService.getStockById(id));
    }

    @GetMapping("/design/{designName}")
    public ResponseEntity<StockDTO> getStockByDesignName(@PathVariable String designName) {
        return ResponseEntity.ok(stockService.getStockByDesignName(designName));
    }

    @GetMapping("/search")
    public ResponseEntity<List<StockDTO>> searchStocks(@RequestParam String q) {
        return ResponseEntity.ok(stockService.searchStocks(q));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<StockDTO>> getLowStockItems(
            @RequestParam(defaultValue = "10") Integer threshold) {
        return ResponseEntity.ok(stockService.getLowStockItems(threshold));
    }

    @PostMapping
    public ResponseEntity<?> createStock(@RequestBody StockDTO stockDTO) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(stockService.createStock(stockDTO));
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(java.util.Map.of("error", "A stock with this design name already exists in this category. Please use a different name."));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<StockDTO> updateStock(@PathVariable Long id, @RequestBody StockDTO stockDTO) {
        return ResponseEntity.ok(stockService.updateStock(id, stockDTO));
    }

    /**
     * Adjusts stock by a delta.
     * delta > 0  → return boxes to inventory (item removed from bill)
     * delta < 0  → deduct boxes from inventory (item added to bill)
     */
    @PatchMapping("/{id}/adjust")
    public ResponseEntity<StockDTO> adjustStock(@PathVariable Long id, @RequestParam int delta) {
        return ResponseEntity.ok(stockService.adjustStock(id, delta));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStock(@PathVariable Long id) {
        stockService.deleteStock(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats/total")
    public ResponseEntity<Integer> getTotalStocks() {
        return ResponseEntity.ok(stockService.getTotalStocks());
    }

    @GetMapping("/stats/low-count")
    public ResponseEntity<Integer> getLowStockCount(
            @RequestParam(defaultValue = "10") Integer threshold) {
        return ResponseEntity.ok(stockService.getLowStockCount(threshold));
    }
}
