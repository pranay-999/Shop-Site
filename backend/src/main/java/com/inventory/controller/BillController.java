package com.inventory.controller;

import com.inventory.dto.BillDTO;
import com.inventory.service.BillService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bills")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class BillController {
    
    private final BillService billService;
    
    public BillController(BillService billService) {
        this.billService = billService;
    }
    
    @GetMapping
    public ResponseEntity<List<BillDTO>> getAllBills() {
        return ResponseEntity.ok(billService.getAllBills());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<BillDTO> getBillById(@PathVariable Long id) {
        return ResponseEntity.ok(billService.getBillById(id));
    }
    
    @GetMapping("/number/{billNumber}")
    public ResponseEntity<BillDTO> getBillByBillNumber(@PathVariable String billNumber) {
        return ResponseEntity.ok(billService.getBillByBillNumber(billNumber));
    }
    
    @GetMapping("/by-stock")
public ResponseEntity<List<BillDTO>> getBillsByDesignName(@RequestParam String designName) {
    return ResponseEntity.ok(billService.getBillsByDesignName(designName));
}

    @GetMapping("/search")
    public ResponseEntity<List<BillDTO>> searchBills(@RequestParam String q) {
        return ResponseEntity.ok(billService.searchBills(q));
    }
    
    @GetMapping("/customer/{customerName}")
    public ResponseEntity<List<BillDTO>> searchByCustomer(@PathVariable String customerName) {
        return ResponseEntity.ok(billService.searchByCustomer(customerName));
    }
    
    @GetMapping("/phone/{phoneNumber}")
    public ResponseEntity<List<BillDTO>> searchByPhone(@PathVariable String phoneNumber) {
        return ResponseEntity.ok(billService.searchByPhone(phoneNumber));
    }

    // Returns next auto-generated bill number — frontend calls this on page load
    @GetMapping("/next-bill-number")
    public ResponseEntity<Map<String, String>> getNextBillNumber() {
        return ResponseEntity.ok(Map.of("billNumber", billService.getNextBillNumber()));
    }
    
    @PostMapping
    public ResponseEntity<BillDTO> createBill(@RequestBody BillDTO billDTO) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(billService.createBill(billDTO));
    }
    
    @PutMapping("/{billNumber}")
    public ResponseEntity<BillDTO> updateBill(
            @PathVariable String billNumber,
            @RequestBody BillDTO billDTO) {
        return ResponseEntity.ok(billService.updateBill(billNumber, billDTO));
    }
    
    @DeleteMapping("/{billNumber}")
    public ResponseEntity<Void> deleteBill(@PathVariable String billNumber) {
        billService.deleteBill(billNumber);
        return ResponseEntity.noContent().build();
    }
    
    @PostMapping("/check-bill-number")
    public ResponseEntity<Map<String, Boolean>> checkBillNumber(@RequestBody Map<String, String> request) {
        String billNumber = request.get("billNumber");
        boolean exists = billService.billNumberExists(billNumber);
        return ResponseEntity.ok(Map.of("exists", exists));
    }
    
    @GetMapping("/filter/today")
    public ResponseEntity<List<BillDTO>> getTodaysBills() {
        return ResponseEntity.ok(billService.getTodaysBills());
    }
    
    @GetMapping("/filter/past-week")
    public ResponseEntity<List<BillDTO>> getPastWeekBills() {
        return ResponseEntity.ok(billService.getPastWeekBills());
    }
    
    @GetMapping("/filter/past-month")
    public ResponseEntity<List<BillDTO>> getPastMonthBills() {
        return ResponseEntity.ok(billService.getPastMonthBills());
    }
    
    @GetMapping("/filter/past-six-months")
    public ResponseEntity<List<BillDTO>> getPastSixMonthsBills() {
        return ResponseEntity.ok(billService.getPastSixMonthsBills());
    }
    
    @GetMapping("/filter/past-year")
    public ResponseEntity<List<BillDTO>> getPastYearBills() {
        return ResponseEntity.ok(billService.getPastYearBills());
    }
    
    @PostMapping("/filter/date-range")
    public ResponseEntity<List<BillDTO>> getBillsByDateRange(@RequestBody Map<String, String> request) {
        LocalDateTime startDate = LocalDateTime.parse(request.get("startDate"));
        LocalDateTime endDate = LocalDateTime.parse(request.get("endDate"));
        return ResponseEntity.ok(billService.getBillsByDateRange(startDate, endDate));
    }
    
    @GetMapping("/stats/total")
    public ResponseEntity<Integer> getTotalBills() {
        return ResponseEntity.ok(billService.getTotalBills());
    }
    
    @GetMapping("/stats/today-revenue")
    public ResponseEntity<Double> getTodaysRevenue() {
        return ResponseEntity.ok(billService.getTodaysRevenue());
    }
}