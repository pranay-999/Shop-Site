package com.inventory.controller;

import com.inventory.service.StockService;
import com.inventory.service.BillService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {
    
    private final StockService stockService;
    private final BillService billService;
    
    public DashboardController(StockService stockService, BillService billService) {
        this.stockService = stockService;
        this.billService = billService;
    }
    
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        
        stats.put("totalItems", stockService.getTotalStocks());
        stats.put("lowStockAlerts", stockService.getLowStockCount(10));
        stats.put("totalBills", billService.getTotalBills());
        stats.put("todaysRevenue", billService.getTodaysRevenue());
        
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/low-stock")
    public ResponseEntity<Map<String, Object>> getLowStockInfo(
            @RequestParam(defaultValue = "10") Integer threshold) {
        Map<String, Object> info = new HashMap<>();
        
        info.put("count", stockService.getLowStockCount(threshold));
        info.put("items", stockService.getLowStockItems(threshold));
        
        return ResponseEntity.ok(info);
    }
}
