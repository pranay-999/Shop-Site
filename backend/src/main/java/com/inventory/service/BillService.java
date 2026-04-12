package com.inventory.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

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

    private BillItemDTO itemToDTO(BillItem item) {
        return new BillItemDTO(
            item.getId(), item.getDesignName(), item.getSize(), item.getType(),
            item.getQuantityBoxes(), item.getPricePerBox(), item.getTotalPrice()
        );
    }

    private BillDTO toDTO(Bill bill) {
    List<BillItemDTO> items = bill.getItems() == null ? List.of() :
        bill.getItems().stream().map(this::itemToDTO).toList();
    return new BillDTO(
        bill.getId(),
        bill.getBillNumber(),
        bill.getCustomerName(),
        bill.getPhoneNumber(),
        bill.getSubtotal() != null ? bill.getSubtotal() : 0.0,
        bill.getGstAmount() != null ? bill.getGstAmount() : 0.0,
        bill.getGstRate() != null ? bill.getGstRate() : 0.0,
        bill.getGstType() != null ? bill.getGstType() : "EXCLUSIVE",
        bill.getDiscount() != null ? bill.getDiscount() : 0.0,
        bill.getTotalAmount() != null ? bill.getTotalAmount() : 0.0,
        items,
        bill.getCreatedAt(),
        bill.getUpdatedAt()
    );
}

    private Bill toEntity(BillDTO dto) {
    Bill bill = new Bill();
    bill.setBillNumber(dto.getBillNumber());
    bill.setCustomerName(dto.getCustomerName());
    bill.setPhoneNumber(dto.getPhoneNumber());
    bill.setSubtotal(dto.getSubtotal() != null ? dto.getSubtotal() : 0.0);
    bill.setGstAmount(dto.getGstAmount() != null ? dto.getGstAmount() : 0.0);
    bill.setGstRate(dto.getGstRate() != null ? dto.getGstRate() : 0.0);
    bill.setGstType(dto.getGstType() != null ? dto.getGstType() : "EXCLUSIVE");
    bill.setDiscount(dto.getDiscount() != null ? dto.getDiscount() : 0.0);
    bill.setTotalAmount(dto.getTotalAmount() != null ? dto.getTotalAmount() : 0.0);
    if (dto.getItems() != null) {
        List<BillItem> items = dto.getItems().stream().map(itemDto -> {
            BillItem item = new BillItem();
            item.setDesignName(itemDto.getDesignName());
            item.setSize(itemDto.getSize());
            item.setType(itemDto.getType());
            item.setQuantityBoxes(itemDto.getQuantityBoxes() != null ? itemDto.getQuantityBoxes() : 0);
            item.setPricePerBox(itemDto.getPricePerBox() != null ? itemDto.getPricePerBox() : 0.0);
            item.setTotalPrice(itemDto.getTotalPrice() != null ? itemDto.getTotalPrice() : 0.0);
            return item;
        }).collect(Collectors.toList());
        bill.setItems(items);
        }
       return bill;
    }

    public List<BillDTO> getAllBills() {
        return billRepository.findAll().stream().map(this::toDTO).toList();
    }

    public BillDTO getBillById(Long id) {
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

    public List<BillDTO> getPastWeekBills() { return getBillsByDateRange(LocalDateTime.now().minusDays(7), LocalDateTime.now()); }
    public List<BillDTO> getPastMonthBills() { return getBillsByDateRange(LocalDateTime.now().minusMonths(1), LocalDateTime.now()); }
    public List<BillDTO> getPastSixMonthsBills() { return getBillsByDateRange(LocalDateTime.now().minusMonths(6), LocalDateTime.now()); }
    public List<BillDTO> getPastYearBills() { return getBillsByDateRange(LocalDateTime.now().minusYears(1), LocalDateTime.now()); }

    public boolean billNumberExists(String billNumber) {
        return billRepository.existsByBillNumber(billNumber);
    }

    public BillDTO createBill(BillDTO billDTO) {
        if (billNumberExists(billDTO.getBillNumber())) {
            throw new RuntimeException("Bill number already exists: " + billDTO.getBillNumber());
        }
        return toDTO(billRepository.save(toEntity(billDTO)));
    }

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
        .mapToDouble(b -> b.getTotalAmount() != null ? b.getTotalAmount() : 0.0)
        .sum();
    }
}