package com.inventory.service;

import com.inventory.dto.BillDTO;
import com.inventory.dto.BillItemDTO;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class BillService {

    private final Map<Long, BillDTO> billsById = new ConcurrentHashMap<>();
    private final Map<String, Long> billNumberIndex = new ConcurrentHashMap<>();
    private final AtomicLong idGenerator = new AtomicLong(1);

    public List<BillDTO> getAllBills() {
        return billsById.values().stream()
                .sorted(Comparator.comparing(BillDTO::getId))
                .toList();
    }

    public BillDTO getBillById(Long id) {
        BillDTO bill = billsById.get(id);
        if (bill == null) {
            throw new RuntimeException("Bill not found with id: " + id);
        }
        return bill;
    }

    public BillDTO getBillByBillNumber(String billNumber) {
        Long id = billNumberIndex.get(billNumber);
        if (id == null) {
            throw new RuntimeException("Bill not found with number: " + billNumber);
        }
        return getBillById(id);
    }

    public List<BillDTO> searchBills(String searchTerm) {
        String q = searchTerm.toLowerCase();
        return billsById.values().stream()
                .filter(bill -> containsIgnoreCase(bill.getBillNumber(), q)
                        || containsIgnoreCase(bill.getCustomerName(), q)
                        || containsIgnoreCase(bill.getPhoneNumber(), q))
                .sorted(Comparator.comparing(BillDTO::getId))
                .toList();
    }

    public List<BillDTO> searchByCustomer(String customerName) {
        String q = customerName.toLowerCase();
        return billsById.values().stream()
                .filter(bill -> containsIgnoreCase(bill.getCustomerName(), q))
                .sorted(Comparator.comparing(BillDTO::getId))
                .toList();
    }

    public List<BillDTO> searchByPhone(String phoneNumber) {
        return billsById.values().stream()
                .filter(bill -> bill.getPhoneNumber() != null && bill.getPhoneNumber().equals(phoneNumber))
                .sorted(Comparator.comparing(BillDTO::getId))
                .toList();
    }

    public List<BillDTO> getBillsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return billsById.values().stream()
                .filter(bill -> bill.getCreatedAt() != null
                        && !bill.getCreatedAt().isBefore(startDate)
                        && !bill.getCreatedAt().isAfter(endDate))
                .sorted(Comparator.comparing(BillDTO::getId))
                .toList();
    }

    public List<BillDTO> getTodaysBills() {
        LocalDateTime todayStart = LocalDateTime.now().toLocalDate().atStartOfDay();
        LocalDateTime tomorrowStart = todayStart.plusDays(1);
        return getBillsByDateRange(todayStart, tomorrowStart.minusNanos(1));
    }

    public List<BillDTO> getPastWeekBills() {
        LocalDateTime endDate = LocalDateTime.now();
        LocalDateTime startDate = endDate.minusDays(7);
        return getBillsByDateRange(startDate, endDate);
    }

    public List<BillDTO> getPastMonthBills() {
        LocalDateTime endDate = LocalDateTime.now();
        LocalDateTime startDate = endDate.minusMonths(1);
        return getBillsByDateRange(startDate, endDate);
    }

    public List<BillDTO> getPastSixMonthsBills() {
        LocalDateTime endDate = LocalDateTime.now();
        LocalDateTime startDate = endDate.minusMonths(6);
        return getBillsByDateRange(startDate, endDate);
    }

    public List<BillDTO> getPastYearBills() {
        LocalDateTime endDate = LocalDateTime.now();
        LocalDateTime startDate = endDate.minusYears(1);
        return getBillsByDateRange(startDate, endDate);
    }

    public boolean billNumberExists(String billNumber) {
        return billNumberIndex.containsKey(billNumber);
    }

    public BillDTO createBill(BillDTO billDTO) {
        if (billNumberExists(billDTO.getBillNumber())) {
            throw new RuntimeException("Bill number already exists: " + billDTO.getBillNumber());
        }

        Long id = billDTO.getId() != null ? billDTO.getId() : idGenerator.getAndIncrement();
        BillDTO saved = copyWithAudit(billDTO, id, LocalDateTime.now(), LocalDateTime.now());
        billsById.put(id, saved);
        billNumberIndex.put(saved.getBillNumber(), id);
        return saved;
    }

    public BillDTO updateBill(String billNumber, BillDTO billDTO) {
        BillDTO existing = getBillByBillNumber(billNumber);

        if (!billNumber.equals(billDTO.getBillNumber()) && billNumberExists(billDTO.getBillNumber())) {
            throw new RuntimeException("Bill number already exists: " + billDTO.getBillNumber());
        }

        BillDTO updated = copyWithAudit(billDTO, existing.getId(), existing.getCreatedAt(), LocalDateTime.now());
        billsById.put(existing.getId(), updated);

        if (!billNumber.equals(updated.getBillNumber())) {
            billNumberIndex.remove(billNumber);
        }
        billNumberIndex.put(updated.getBillNumber(), existing.getId());

        return updated;
    }

    public void deleteBill(String billNumber) {
        BillDTO bill = getBillByBillNumber(billNumber);
        billsById.remove(bill.getId());
        billNumberIndex.remove(billNumber);
    }

    public Integer getTotalBills() {
        return billsById.size();
    }

    public Double getTodaysRevenue() {
        return getTodaysBills().stream()
                .mapToDouble(bill -> bill.getTotalAmount() == null ? 0.0 : bill.getTotalAmount())
                .sum();
    }

    private BillDTO copyWithAudit(BillDTO source, Long id, LocalDateTime createdAt, LocalDateTime updatedAt) {
        List<BillItemDTO> items = source.getItems() == null ? List.of() : source.getItems().stream()
                .map(item -> new BillItemDTO(
                        item.getId(),
                        item.getDesignName(),
                        item.getSize(),
                        item.getType(),
                        item.getQuantityBoxes(),
                        item.getPricePerBox(),
                        item.getTotalPrice()
                ))
                .toList();

        return new BillDTO(
                id,
                source.getBillNumber(),
                source.getCustomerName(),
                source.getPhoneNumber(),
                source.getSubtotal(),
                source.getGstAmount(),
                source.getGstRate(),
                source.getGstType(),
                source.getDiscount(),
                source.getTotalAmount(),
                items,
                createdAt,
                updatedAt
        );
    }

    private boolean containsIgnoreCase(String value, String query) {
        return value != null && value.toLowerCase().contains(query);
    }
}
