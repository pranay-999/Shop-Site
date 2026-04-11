package com.inventory.service;

import com.inventory.dto.StockDTO;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class StockService {

    private final Map<Long, StockDTO> stocks = new ConcurrentHashMap<>();
    private final AtomicLong idGenerator = new AtomicLong(1);

    public List<StockDTO> getAllStocks() {
        return stocks.values().stream()
                .sorted(Comparator.comparing(StockDTO::getId))
                .toList();
    }

    public StockDTO getStockById(Long id) {
        StockDTO stock = stocks.get(id);
        if (stock == null) {
            throw new RuntimeException("Stock not found with id: " + id);
        }
        return stock;
    }

    public StockDTO getStockByDesignName(String designName) {
        return stocks.values().stream()
                .filter(stock -> stock.getDesignName() != null
                        && stock.getDesignName().equalsIgnoreCase(designName))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Stock not found with design name: " + designName));
    }

    public List<StockDTO> searchStocks(String searchTerm) {
        String q = searchTerm.toLowerCase();
        return stocks.values().stream()
                .filter(stock -> containsIgnoreCase(stock.getDesignName(), q)
                        || containsIgnoreCase(stock.getSize(), q)
                        || containsIgnoreCase(stock.getType(), q))
                .sorted(Comparator.comparing(StockDTO::getId))
                .toList();
    }

    public List<StockDTO> getLowStockItems(Integer threshold) {
        return stocks.values().stream()
                .filter(stock -> stock.getTotalBoxes() != null && stock.getTotalBoxes() < threshold)
                .sorted(Comparator.comparing(StockDTO::getId))
                .toList();
    }

    public StockDTO createStock(StockDTO stockDTO) {
        LocalDateTime now = LocalDateTime.now();
        Long id = stockDTO.getId() != null ? stockDTO.getId() : idGenerator.getAndIncrement();
        StockDTO saved = new StockDTO(
                id,
                stockDTO.getDesignName(),
                stockDTO.getSize(),
                stockDTO.getType(),
                stockDTO.getTotalBoxes(),
                stockDTO.getPricePerBox(),
                stockDTO.getCategoryId(),
                stockDTO.getCreatedAt() != null ? stockDTO.getCreatedAt() : now,
                now
        );
        stocks.put(id, saved);
        return saved;
    }

    public StockDTO updateStock(Long id, StockDTO stockDTO) {
        StockDTO existing = getStockById(id);
        StockDTO updated = new StockDTO(
                existing.getId(),
                stockDTO.getDesignName(),
                stockDTO.getSize(),
                stockDTO.getType(),
                stockDTO.getTotalBoxes(),
                stockDTO.getPricePerBox(),
                stockDTO.getCategoryId(),
                existing.getCreatedAt(),
                LocalDateTime.now()
        );
        stocks.put(id, updated);
        return updated;
    }

    public void deleteStock(Long id) {
        if (stocks.remove(id) == null) {
            throw new RuntimeException("Stock not found with id: " + id);
        }
    }

    public Integer getTotalStocks() {
        return stocks.size();
    }

    public Integer getLowStockCount(Integer threshold) {
        return (int) stocks.values().stream()
                .filter(stock -> stock.getTotalBoxes() != null && stock.getTotalBoxes() < threshold)
                .count();
    }

    private boolean containsIgnoreCase(String value, String query) {
        return value != null && value.toLowerCase().contains(query);
    }
}
