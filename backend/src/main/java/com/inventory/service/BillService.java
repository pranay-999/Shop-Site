package com.inventory.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.inventory.dto.BillDTO;
import com.inventory.dto.BillItemDTO;
import com.inventory.model.Bill;
import com.inventory.model.BillItem;
import com.inventory.repository.BillRepository;
import com.inventory.repository.StockRepository;

@Service
public class BillService {

    private final BillRepository billRepository;
    private final StockRepository stockRepository;

    public BillService(BillRepository billRepository, StockRepository stockRepository) {
        this.billRepository = billRepository;
        this.stockRepository = stockRepository;
    }

    // Generates the next bill number like INV-20260412-001
    private String generateNextBillNumber() {
        String today = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String prefix = "INV-" + today + "-";
        long todayCount = billRepository.findAll().stream()
            .filter(b -> b.getBillNumber() != null && b.getBillNumber().startsWith(prefix))
            .count();
        return prefix + String.format("%03d", todayCount + 1);
    }

    // Public — called by BillController for /next-bill-number endpoint
    public String getNextBillNumber() {
        return generateNextBillNumber();
    }

    private BillItemDTO itemToDTO(BillItem item) {
        int qty      = item.getQuantityBoxes() == null ? 0   : item.getQuantityBoxes();
        double price = item.getPricePerBox()   == null ? 0.0 : item.getPricePerBox();
        double total = item.getTotalPrice()    == null ? 0.0 : item.getTotalPrice();
        return new BillItemDTO(item.getId(), item.getDesignName(), item.getSize(), item.getType(), qty, price, total);
    }

    private BillDTO toDTO(Bill bill) {
        List<BillItemDTO> items = bill.getItems() == null ? List.of() :
            bill.getItems().stream().map(this::itemToDTO).toList();
        double subtotal    = bill.getSubtotal()    == null ? 0.0        : bill.getSubtotal();
        double gstAmount   = bill.getGstAmount()   == null ? 0.0        : bill.getGstAmount();
        double gstRate     = bill.getGstRate()     == null ? 0.0        : bill.getGstRate();
        double discount    = bill.getDiscount()    == null ? 0.0        : bill.getDiscount();
        double totalAmount = bill.getTotalAmount() == null ? 0.0        : bill.getTotalAmount();
        String gstType     = bill.getGstType()     == null ? "EXCLUSIVE" : bill.getGstType();
        return new BillDTO(
            bill.getId(), bill.getBillNumber(), bill.getCustomerName(), bill.getPhoneNumber(),
            subtotal, gstAmount, gstRate, gstType, discount, totalAmount,
            items, bill.getCreatedAt(), bill.getUpdatedAt()
        );
    }

    private Bill toEntity(BillDTO dto) {
        Bill bill = new Bill();

        if (dto.getBillNumber() == null || dto.getBillNumber().trim().isEmpty())
            throw new RuntimeException("Bill number is required");
        if (dto.getCustomerName() == null || dto.getCustomerName().trim().isEmpty())
            throw new RuntimeException("Customer name is required");
        if (dto.getPhoneNumber() == null || dto.getPhoneNumber().trim().isEmpty())
            throw new RuntimeException("Phone number is required");

        bill.setBillNumber(dto.getBillNumber().trim());
        bill.setCustomerName(dto.getCustomerName().trim());
        bill.setPhoneNumber(dto.getPhoneNumber().trim());
        bill.setSubtotal(    dto.getSubtotal()    == null ? 0.0         : dto.getSubtotal());
        bill.setGstAmount(   dto.getGstAmount()   == null ? 0.0         : dto.getGstAmount());
        bill.setGstRate(     dto.getGstRate()     == null ? 0.0         : dto.getGstRate());
        bill.setGstType(     dto.getGstType()     == null ? "EXCLUSIVE" : dto.getGstType());
        bill.setDiscount(    dto.getDiscount()    == null ? 0.0         : dto.getDiscount());
        bill.setTotalAmount( dto.getTotalAmount() == null ? 0.0         : dto.getTotalAmount());

        if (dto.getItems() != null) {
            List<BillItem> items = dto.getItems().stream().map(itemDto -> {
                BillItem item = new BillItem();
                if (itemDto.getDesignName() == null || itemDto.getDesignName().trim().isEmpty())
                    throw new RuntimeException("Item design name is required");
                if (itemDto.getSize() == null || itemDto.getSize().trim().isEmpty())
                    throw new RuntimeException("Item size is required");
                if (itemDto.getType() == null || itemDto.getType().trim().isEmpty())
                    throw new RuntimeException("Item type is required");
                item.setDesignName(itemDto.getDesignName().trim());
                item.setSize(itemDto.getSize().trim());
                item.setType(itemDto.getType().trim());
                item.setQuantityBoxes(itemDto.getQuantityBoxes() == null ? 0   : itemDto.getQuantityBoxes());
                item.setPricePerBox(  itemDto.getPricePerBox()   == null ? 0.0 : itemDto.getPricePerBox());
                item.setTotalPrice(   itemDto.getTotalPrice()    == null ? 0.0 : itemDto.getTotalPrice());
                item.setBill(bill);
                return item;
            }).collect(Collectors.toList());
            bill.setItems(items);
        }
        return bill;
    }

    public List<BillDTO> getAllBills() {
        return billRepository.findAll().stream().map(this::toDTO).toList();
    }

    public BillDTO getBillById(@NonNull Long id) {
        return toDTO(billRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Bill not found with id: " + id)));
    }

    public BillDTO getBillByBillNumber(String billNumber) {
        return toDTO(billRepository.findByBillNumber(billNumber)
            .orElseThrow(() -> new RuntimeException("Bill not found: " + billNumber)));
    }

    public List<BillDTO> searchBills(String q) {
        String lower = q.toLowerCase();
        return billRepository.findAll().stream()
            .filter(b -> (b.getBillNumber() != null && b.getBillNumber().toLowerCase().contains(lower))
                || (b.getCustomerName() != null && b.getCustomerName().toLowerCase().contains(lower))
                || (b.getPhoneNumber() != null && b.getPhoneNumber().toLowerCase().contains(lower)))
            .map(this::toDTO).toList();
    }

    public List<BillDTO> searchByCustomer(String customerName) {
        return billRepository.findByCustomerNameContainingIgnoreCase(customerName)
            .stream().map(this::toDTO).toList();
    }

    public List<BillDTO> searchByPhone(String phoneNumber) {
        return billRepository.findByPhoneNumber(phoneNumber)
            .stream().map(this::toDTO).toList();
    }

    public List<BillDTO> getBillsByDateRange(LocalDateTime start, LocalDateTime end) {
        return billRepository.findByCreatedAtBetween(start, end)
            .stream().map(this::toDTO).toList();
    }

    public List<BillDTO> getTodaysBills() {
        LocalDateTime start = LocalDateTime.now().toLocalDate().atStartOfDay();
        return getBillsByDateRange(start, LocalDateTime.now());
    }

    public List<BillDTO> getPastWeekBills()     { return getBillsByDateRange(LocalDateTime.now().minusDays(7),   LocalDateTime.now()); }
    public List<BillDTO> getPastMonthBills()     { return getBillsByDateRange(LocalDateTime.now().minusMonths(1), LocalDateTime.now()); }
    public List<BillDTO> getPastSixMonthsBills() { return getBillsByDateRange(LocalDateTime.now().minusMonths(6), LocalDateTime.now()); }
    public List<BillDTO> getPastYearBills()      { return getBillsByDateRange(LocalDateTime.now().minusYears(1),  LocalDateTime.now()); }

    public boolean billNumberExists(String billNumber) {
        return billRepository.existsByBillNumber(billNumber);
    }

    @Transactional
    public BillDTO createBill(BillDTO billDTO) {
        if (billDTO.getBillNumber() == null || billDTO.getBillNumber().trim().isEmpty())
            throw new RuntimeException("Bill number is required");
        if (billNumberExists(billDTO.getBillNumber().trim()))
            throw new RuntimeException("Bill number already exists: " + billDTO.getBillNumber());

        Bill saved = billRepository.save(toEntity(billDTO));

        // Deduct boxes from each stock item in the database
        if (billDTO.getItems() != null) {
            for (BillItemDTO item : billDTO.getItems()) {
                if (item.getStockId() != null) {
                    stockRepository.findById(item.getStockId()).ifPresent(stock -> {
                        int currentBoxes = stock.getTotalBoxes() == null ? 0 : stock.getTotalBoxes();
                        int soldBoxes    = item.getQuantityBoxes() == null ? 0 : item.getQuantityBoxes();
                        stock.setTotalBoxes(Math.max(0, currentBoxes - soldBoxes));
                        stockRepository.save(stock);
                    });
                }
            }
        }

        return toDTO(saved);
    }

    @Transactional
    public BillDTO updateBill(String billNumber, BillDTO billDTO) {
        Bill existing = billRepository.findByBillNumber(billNumber)
            .orElseThrow(() -> new RuntimeException("Bill not found: " + billNumber));
        Bill updated = toEntity(billDTO);
        updated.setId(existing.getId());
        updated.setCreatedAt(existing.getCreatedAt());
        return toDTO(billRepository.save(updated));
    }

    public void deleteBill(String billNumber) {
        Bill bill = billRepository.findByBillNumber(billNumber)
            .orElseThrow(() -> new RuntimeException("Bill not found: " + billNumber));
        billRepository.delete(bill);
    }

    public Integer getTotalBills() { return (int) billRepository.count(); }

    public Double getTodaysRevenue() {
        return getTodaysBills().stream()
            .mapToDouble(b -> b.getTotalAmount() == null ? 0.0 : b.getTotalAmount())
            .sum();
    }
}