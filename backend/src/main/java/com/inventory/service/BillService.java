package com.inventory.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.inventory.dto.BillDTO;
import com.inventory.dto.BillItemDTO;
import com.inventory.model.Bill;
import com.inventory.model.BillItem;
import com.inventory.repository.BillRepository;

@Service
@Transactional
public class BillService {
    
    private final BillRepository billRepository;
    
    public BillService(BillRepository billRepository) {
        this.billRepository = billRepository;
    }
    
    public List<BillDTO> getAllBills() {
        return billRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @SuppressWarnings("null")
    public BillDTO getBillById(Long id) {
        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bill not found with id: " + id));
        return convertToDTO(bill);
    }
    
    public BillDTO getBillByBillNumber(String billNumber) {
        Bill bill = billRepository.findByBillNumber(billNumber)
                .orElseThrow(() -> new RuntimeException("Bill not found with number: " + billNumber));
        return convertToDTO(bill);
    }
    
    public List<BillDTO> searchBills(String searchTerm) {
        return billRepository.searchBills(searchTerm)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<BillDTO> searchByCustomer(String customerName) {
        return billRepository.findByCustomerNameContainingIgnoreCase(customerName)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<BillDTO> searchByPhone(String phoneNumber) {
        return billRepository.findByPhoneNumber(phoneNumber)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<BillDTO> getBillsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return billRepository.findBillsByDateRange(startDate, endDate)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<BillDTO> getTodaysBills() {
        return billRepository.findTodaysBills()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
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
        return billRepository.existsByBillNumber(billNumber);
    }
    
    @SuppressWarnings("null")
    public BillDTO createBill(BillDTO billDTO) {
        if (billRepository.existsByBillNumber(billDTO.getBillNumber())) {
            throw new RuntimeException("Bill number already exists: " + billDTO.getBillNumber());
        }
        
        Bill bill = convertToEntity(billDTO);
        Bill savedBill = billRepository.save(bill);
        return convertToDTO(savedBill);
    }
    
    public BillDTO updateBill(String billNumber, BillDTO billDTO) {
        Bill bill = billRepository.findByBillNumber(billNumber)
                .orElseThrow(() -> new RuntimeException("Bill not found with number: " + billNumber));
        
        bill.setCustomerName(billDTO.getCustomerName());
        bill.setPhoneNumber(billDTO.getPhoneNumber());
        bill.setSubtotal(billDTO.getSubtotal());
        bill.setGstAmount(billDTO.getGstAmount());
        bill.setGstRate(billDTO.getGstRate());
        bill.setGstType(billDTO.getGstType());
        bill.setDiscount(billDTO.getDiscount());
        bill.setTotalAmount(billDTO.getTotalAmount());
        
        // Update items
        bill.getItems().clear();
        if (billDTO.getItems() != null) {
            billDTO.getItems().forEach(itemDTO -> {
                BillItem item = convertItemToEntity(itemDTO);
                item.setBill(bill);
                bill.getItems().add(item);
            });
        }
        
        Bill updatedBill = billRepository.save(bill);
        return convertToDTO(updatedBill);
    }
    
    @SuppressWarnings("null")
    public void deleteBill(String billNumber) {
        Bill bill = billRepository.findByBillNumber(billNumber)
                .orElseThrow(() -> new RuntimeException("Bill not found with number: " + billNumber));
        billRepository.delete(bill);
    }
    
    public Integer getTotalBills() {
        return (int) billRepository.count();
    }
    
    public Double getTodaysRevenue() {
        return billRepository.findTodaysBills()
                .stream()
                .mapToDouble(Bill::getTotalAmount)
                .sum();
    }
    
    private BillDTO convertToDTO(Bill bill) {
        List<BillItemDTO> itemDTOs = bill.getItems() != null ?
                bill.getItems().stream().map(this::convertItemToDTO).collect(Collectors.toList()) :
                List.of();
        
        return new BillDTO(
                bill.getId(),
                bill.getBillNumber(),
                bill.getCustomerName(),
                bill.getPhoneNumber(),
                bill.getSubtotal(),
                bill.getGstAmount(),
                bill.getGstRate(),
                bill.getGstType(),
                bill.getDiscount(),
                bill.getTotalAmount(),
                itemDTOs,
                bill.getCreatedAt(),
                bill.getUpdatedAt()
        );
    }
    
    private Bill convertToEntity(BillDTO billDTO) {
        Bill bill = new Bill();
        bill.setBillNumber(billDTO.getBillNumber());
        bill.setCustomerName(billDTO.getCustomerName());
        bill.setPhoneNumber(billDTO.getPhoneNumber());
        bill.setSubtotal(billDTO.getSubtotal());
        bill.setGstAmount(billDTO.getGstAmount());
        bill.setGstRate(billDTO.getGstRate());
        bill.setGstType(billDTO.getGstType());
        bill.setDiscount(billDTO.getDiscount());
        bill.setTotalAmount(billDTO.getTotalAmount());
        
        if (billDTO.getItems() != null) {
            bill.setItems(billDTO.getItems().stream()
                    .map(itemDTO -> {
                        BillItem item = convertItemToEntity(itemDTO);
                        item.setBill(bill);
                        return item;
                    })
                    .collect(Collectors.toList()));
        }
        
        return bill;
    }
    
    private BillItemDTO convertItemToDTO(BillItem item) {
        return new BillItemDTO(
                item.getId(),
                item.getDesignName(),
                item.getSize(),
                item.getType(),
                item.getQuantityBoxes(),
                item.getPricePerBox(),
                item.getTotalPrice()
        );
    }
    
    private BillItem convertItemToEntity(BillItemDTO itemDTO) {
        return new BillItem(
                itemDTO.getId(),
                null,
                itemDTO.getDesignName(),
                itemDTO.getSize(),
                itemDTO.getType(),
                itemDTO.getQuantityBoxes(),
                itemDTO.getPricePerBox(),
                itemDTO.getTotalPrice()
        );
    }
}
