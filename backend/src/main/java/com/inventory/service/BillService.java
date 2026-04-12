package com.inventory.service;

import java.time.LocalDateTime;
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

@Service
public class BillService {

    private final BillRepository billRepository;

    public BillService(BillRepository billRepository) {
        this.billRepository = billRepository;
    }

    // Converts a BillItem (database row) → BillItemDTO (what we send to frontend)
    private BillItemDTO itemToDTO(BillItem item) {
        int qty      = item.getQuantityBoxes() == null ? 0   : item.getQuantityBoxes();
        double price = item.getPricePerBox()   == null ? 0.0 : item.getPricePerBox();
        double total = item.getTotalPrice()    == null ? 0.0 : item.getTotalPrice();
        return new BillItemDTO(item.getId(), item.getDesignName(), item.getSize(), item.getType(), qty, price, total);
    }

    // Converts a Bill (database row) → BillDTO (what we send to frontend)
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

    // Converts a BillDTO (from frontend) → Bill (database row)
    private Bill toEntity(BillDTO dto) {
        Bill bill = new Bill();
        bill.setBillNumber(dto.getBillNumber());
        bill.setCustomerName(dto.getCustomerName());
        bill.setPhoneNumber(dto.getPhoneNumber());
        bill.setSubtotal(    dto.getSubtotal()    == null ? 0.0         : dto.getSubtotal());
        bill.setGstAmount(   dto.getGstAmount()   == null ? 0.0         : dto.getGstAmount());
        bill.setGstRate(     dto.getGstRate()     == null ? 0.0         : dto.getGstRate());
        bill.setGstType(     dto.getGstType()     == null ? "EXCLUSIVE" : dto.getGstType());
        bill.setDiscount(    dto.getDiscount()    == null ? 0.0         : dto.getDiscount());
        bill.setTotalAmount( dto.getTotalAmount() == null ? 0.0         : dto.getTotalAmount());
        if (dto.getItems() != null) {
            List<BillItem> items = dto.getItems().stream().map(itemDto -> {
                BillItem item = new BillItem();
                item.setDesignName(itemDto.getDesignName());
                item.setSize(itemDto.getSize());
                item.setType(itemDto.getType());
                item.setQuantityBoxes(itemDto.getQuantityBoxes() == null ? 0   : itemDto.getQuantityBoxes());
                item.setPricePerBox(  itemDto.getPricePerBox()   == null ? 0.0 : itemDto.getPricePerBox());
                item.setTotalPrice(   itemDto.getTotalPrice()    == null ? 0.0 : itemDto.getTotalPrice());
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
        if (billNumberExists(billDTO.getBillNumber())) {
            throw new RuntimeException("Bill number already exists: " + billDTO.getBillNumber());
        }
        Bill saved = billRepository.save(toEntity(billDTO));
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