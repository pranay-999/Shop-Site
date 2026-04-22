package com.inventory.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.inventory.dto.BillDTO;
import com.inventory.dto.BillItemDTO;
import com.inventory.dto.BillSnapshotDTO;
import com.inventory.model.Bill;
import com.inventory.model.BillHistory;
import com.inventory.model.BillItem;
import com.inventory.repository.BillHistoryRepository;
import com.inventory.repository.BillRepository;
import com.inventory.repository.StockRepository;

@Service
public class BillService {

    private final BillRepository billRepository;
    private final StockRepository stockRepository;
    private final BillHistoryRepository billHistoryRepository;

    // Jackson mapper for serializing bill snapshots to/from JSON
    private final ObjectMapper objectMapper;

    public BillService(BillRepository billRepository,
                       StockRepository stockRepository,
                       BillHistoryRepository billHistoryRepository) {
        this.billRepository = billRepository;
        this.stockRepository = stockRepository;
        this.billHistoryRepository = billHistoryRepository;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    // ── Bill Number Generator ─────────────────────────────────────────────────
    private String generateNextBillNumber() {
        String today = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String prefix = "INV-" + today + "-";
        // Use a single DB-level MAX query instead of loading all bills into memory.
        // Sequence never resets: even on a new day we continue from the global max.
        Integer maxSeq = billRepository.findMaxBillSequence();
        int next = (maxSeq == null || maxSeq >= 999) ? 1 : maxSeq + 1;
        return prefix + String.format("%03d", next);
    }

    public String getNextBillNumber() {
        return generateNextBillNumber();
    }

    // ── Helper: treat stockId=0 as null ──────────────────────────────────────
    private Long safeStockId(Long stockId) {
        if (stockId == null || stockId == 0L) return null;
        return stockId;
    }

    // ── Converters ────────────────────────────────────────────────────────────
    private BillItemDTO itemToDTO(BillItem item) {
        int qty      = item.getQuantityBoxes() == null ? 0   : item.getQuantityBoxes();
        double price = item.getPricePerBox()   == null ? 0.0 : item.getPricePerBox();
        double total = item.getTotalPrice()    == null ? 0.0 : item.getTotalPrice();
        return new BillItemDTO(item.getId(), item.getStockId(), item.getDesignName(),
                               item.getSize(), item.getType(), qty, price, total);
    }

    /** Convert a BillHistory row → BillSnapshotDTO by parsing the stored JSON */
    private BillSnapshotDTO historyToSnapshotDTO(BillHistory h) {
        try {
            BillSnapshotDTO snap = objectMapper.readValue(h.getSnapshotJson(), BillSnapshotDTO.class);
            snap.setSnapshotAt(h.getSnapshotAt());
            snap.setEditNote(h.getEditNote());
            return snap;
        } catch (Exception e) {
            // If JSON parsing fails for any reason, return a minimal placeholder
            BillSnapshotDTO fallback = new BillSnapshotDTO();
            fallback.setSnapshotAt(h.getSnapshotAt());
            fallback.setEditNote("(could not parse snapshot)");
            return fallback;
        }
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

        // Load and convert all history snapshots (oldest first)
        List<BillSnapshotDTO> history = bill.getHistory() == null ? List.of() :
            bill.getHistory().stream().map(this::historyToSnapshotDTO).toList();

        return new BillDTO(
            bill.getId(), bill.getBillNumber(), bill.getCustomerName(), bill.getPhoneNumber(),
            subtotal, gstAmount, gstRate, gstType, discount, totalAmount,
            items, bill.getCreatedAt(), bill.getUpdatedAt(),
            bill.getIsEdited(), bill.getEditedAt(),
            history
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
                item.setStockId(      safeStockId(itemDto.getStockId()));
                item.setDesignName(   itemDto.getDesignName().trim());
                item.setSize(         itemDto.getSize().trim());
                item.setType(         itemDto.getType().trim());
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

    // ── Snapshot helper ───────────────────────────────────────────────────────

    /**
     * Captures the current state of a bill as a JSON snapshot and saves it
     * to bill_history BEFORE the bill is modified. Call this at the start of updateBill().
     */
    private void saveSnapshot(Bill existing) {
        try {
            // Build a snapshot DTO from the current (about-to-be-overwritten) bill state
            BillSnapshotDTO snap = new BillSnapshotDTO();
            snap.setCustomerName(existing.getCustomerName());
            snap.setPhoneNumber(existing.getPhoneNumber());
            snap.setSubtotal(existing.getSubtotal()    == null ? 0.0 : existing.getSubtotal());
            snap.setGstRate(existing.getGstRate()      == null ? 0.0 : existing.getGstRate());
            snap.setGstType(existing.getGstType()      == null ? "EXCLUSIVE" : existing.getGstType());
            snap.setGstAmount(existing.getGstAmount()  == null ? 0.0 : existing.getGstAmount());
            snap.setDiscount(existing.getDiscount()    == null ? 0.0 : existing.getDiscount());
            snap.setTotalAmount(existing.getTotalAmount() == null ? 0.0 : existing.getTotalAmount());

            List<BillItemDTO> itemDTOs = existing.getItems() == null ? new ArrayList<>() :
                existing.getItems().stream().map(this::itemToDTO).collect(Collectors.toList());
            snap.setItems(itemDTOs);

            // Serialize just the bill data fields to JSON (not snapshotAt/editNote — those come from BillHistory)
            String json = objectMapper.writeValueAsString(snap);

            // Save the history row
            BillHistory history = new BillHistory();
            history.setBill(existing);
            history.setSnapshotAt(LocalDateTime.now());
            history.setEditNote(existing.getEditNote()); // carry over any previous note
            history.setSnapshotJson(json);

            billHistoryRepository.save(history);
        } catch (Exception e) {
            // Non-fatal — log and continue. Don't block the save just because snapshot failed.
            System.err.println("[BillService] Warning: could not save bill snapshot: " + e.getMessage());
        }
    }

    // ── Stock helpers ─────────────────────────────────────────────────────────

    private void restoreStock(List<BillItem> items) {
        if (items == null) return;
        for (BillItem item : items) {
            int qty = item.getQuantityBoxes() == null ? 0 : item.getQuantityBoxes();
            if (qty <= 0) continue;
            Long stockId = safeStockId(item.getStockId());
            if (stockId != null) {
                stockRepository.findById(stockId).ifPresent(stock -> {
                    stock.setTotalBoxes((stock.getTotalBoxes() == null ? 0 : stock.getTotalBoxes()) + qty);
                    stock.setSoldBoxes(Math.max(0, (stock.getSoldBoxes() == null ? 0 : stock.getSoldBoxes()) - qty));
                    stockRepository.save(stock);
                });
            } else if (item.getDesignName() != null) {
                stockRepository.findAll().stream()
                    .filter(s -> s.getDesignName() != null &&
                                 s.getDesignName().equalsIgnoreCase(item.getDesignName().trim()))
                    .findFirst()
                    .ifPresent(stock -> {
                        stock.setTotalBoxes((stock.getTotalBoxes() == null ? 0 : stock.getTotalBoxes()) + qty);
                        stock.setSoldBoxes(Math.max(0, (stock.getSoldBoxes() == null ? 0 : stock.getSoldBoxes()) - qty));
                        stockRepository.save(stock);
                    });
            }
        }
    }

    private void deductStock(List<BillItemDTO> items) {
        if (items == null) return;
        for (BillItemDTO item : items) {
            int qty = item.getQuantityBoxes() == null ? 0 : item.getQuantityBoxes();
            if (qty <= 0) continue;
            Long stockId = safeStockId(item.getStockId());
            if (stockId != null) {
                stockRepository.findById(stockId).ifPresent(stock -> {
                    stock.setTotalBoxes(Math.max(0, (stock.getTotalBoxes() == null ? 0 : stock.getTotalBoxes()) - qty));
                    stock.setSoldBoxes((stock.getSoldBoxes() == null ? 0 : stock.getSoldBoxes()) + qty);
                    stockRepository.save(stock);
                });
            } else if (item.getDesignName() != null) {
                stockRepository.findAll().stream()
                    .filter(s -> s.getDesignName() != null &&
                                 s.getDesignName().equalsIgnoreCase(item.getDesignName().trim()))
                    .findFirst()
                    .ifPresent(stock -> {
                        stock.setTotalBoxes(Math.max(0, (stock.getTotalBoxes() == null ? 0 : stock.getTotalBoxes()) - qty));
                        stock.setSoldBoxes((stock.getSoldBoxes() == null ? 0 : stock.getSoldBoxes()) + qty);
                        stockRepository.save(stock);
                    });
            }
        }
    }

    // ── CRUD ──────────────────────────────────────────────────────────────────

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

    public List<BillDTO> getBillsByDesignName(String designName) {
        return billRepository.findBillsByDesignName(designName)
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

    // ── Create ────────────────────────────────────────────────────────────────
    @Transactional
    public BillDTO createBill(BillDTO billDTO) {
        if (billDTO.getBillNumber() == null || billDTO.getBillNumber().trim().isEmpty())
            throw new RuntimeException("Bill number is required");
        if (billNumberExists(billDTO.getBillNumber().trim()))
            throw new RuntimeException("Bill number already exists: " + billDTO.getBillNumber());

        Bill saved = billRepository.save(toEntity(billDTO));
        deductStock(billDTO.getItems());
        return toDTO(saved);
    }

    // ── Update ────────────────────────────────────────────────────────────────
    @Transactional
    public BillDTO updateBill(String billNumber, BillDTO billDTO) {
        Bill existing = billRepository.findByBillNumber(billNumber)
            .orElseThrow(() -> new RuntimeException("Bill not found: " + billNumber));

        // Step 1: Save a snapshot of the CURRENT state BEFORE overwriting it
        saveSnapshot(existing);

        // Step 2: Restore stock for the old items
        restoreStock(existing.getItems());

        // Step 3: Update the bill in-place
        existing.setCustomerName(billDTO.getCustomerName() == null ? existing.getCustomerName() : billDTO.getCustomerName().trim());
        existing.setPhoneNumber( billDTO.getPhoneNumber()  == null ? existing.getPhoneNumber()  : billDTO.getPhoneNumber().trim());
        existing.setSubtotal(    billDTO.getSubtotal()     == null ? 0.0 : billDTO.getSubtotal());
        existing.setGstAmount(   billDTO.getGstAmount()    == null ? 0.0 : billDTO.getGstAmount());
        existing.setGstRate(     billDTO.getGstRate()      == null ? 0.0 : billDTO.getGstRate());
        existing.setGstType(     billDTO.getGstType()      == null ? "EXCLUSIVE" : billDTO.getGstType());
        existing.setDiscount(    billDTO.getDiscount()     == null ? 0.0 : billDTO.getDiscount());
        existing.setTotalAmount( billDTO.getTotalAmount()  == null ? 0.0 : billDTO.getTotalAmount());
        existing.setIsEdited(true);
        existing.setEditedAt(LocalDateTime.now());

        // Step 4: Replace items (orphanRemoval handles DELETE of old rows)
        existing.getItems().clear();
        if (billDTO.getItems() != null) {
            for (BillItemDTO itemDto : billDTO.getItems()) {
                if (itemDto.getDesignName() == null || itemDto.getDesignName().trim().isEmpty())
                    throw new RuntimeException("Item design name is required");
                if (itemDto.getSize() == null || itemDto.getSize().trim().isEmpty())
                    throw new RuntimeException("Item size is required");
                if (itemDto.getType() == null || itemDto.getType().trim().isEmpty())
                    throw new RuntimeException("Item type is required");
                BillItem item = new BillItem();
                item.setStockId(      safeStockId(itemDto.getStockId()));
                item.setDesignName(   itemDto.getDesignName().trim());
                item.setSize(         itemDto.getSize().trim());
                item.setType(         itemDto.getType().trim());
                item.setQuantityBoxes(itemDto.getQuantityBoxes() == null ? 0   : itemDto.getQuantityBoxes());
                item.setPricePerBox(  itemDto.getPricePerBox()   == null ? 0.0 : itemDto.getPricePerBox());
                item.setTotalPrice(   itemDto.getTotalPrice()    == null ? 0.0 : itemDto.getTotalPrice());
                item.setBill(existing);
                existing.getItems().add(item);
            }
        }

        Bill saved = billRepository.save(existing);

        // Step 5: Deduct stock for the new items
        deductStock(billDTO.getItems());

        return toDTO(saved);
    }

    // ── Delete ────────────────────────────────────────────────────────────────
    @Transactional
    public void deleteBill(String billNumber) {
        Bill bill = billRepository.findByBillNumber(billNumber)
            .orElseThrow(() -> new RuntimeException("Bill not found: " + billNumber));
        restoreStock(bill.getItems());
        billRepository.delete(bill);  // cascade deletes history rows too
    }

    // ── Stats ─────────────────────────────────────────────────────────────────
    public Integer getTotalBills() { return (int) billRepository.count(); }

    public Double getTodaysRevenue() {
        return getTodaysBills().stream()
            .mapToDouble(b -> b.getTotalAmount() == null ? 0.0 : b.getTotalAmount())
            .sum();
    }
}