package com.inventory.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.inventory.dto.StockDTO;
import com.inventory.model.Stock;
import com.inventory.repository.StockRepository;

@Service
public class StockService {

    // Spring automatically gives us a StockRepository connected to the database
    private final StockRepository stockRepository;

    public StockService(StockRepository stockRepository) {
        this.stockRepository = stockRepository;
    }

    // Helper: converts a Stock database row → StockDTO (what we send to the frontend)
    private StockDTO toDTO(Stock stock) {
        return new StockDTO(
            stock.getId(), stock.getDesignName(), stock.getSize(), stock.getType(),
            stock.getTotalBoxes(), stock.getPricePerBox(), stock.getCategoryId(),
            stock.getCreatedAt(), stock.getUpdatedAt()
        );
    }

    // Helper: converts a StockDTO (from frontend) → Stock database row
    private Stock toEntity(StockDTO dto) {
        Stock s = new Stock();
        s.setDesignName(dto.getDesignName());
        s.setSize(dto.getSize());
        s.setType(dto.getType());
        s.setTotalBoxes(dto.getTotalBoxes());
        s.setPricePerBox(dto.getPricePerBox());
        s.setCategoryId(dto.getCategoryId());
        return s;
    }

    public List<StockDTO> getAllStocks() {
        return stockRepository.findAll().stream().map(this::toDTO).toList();
    }

    public StockDTO getStockById(Long id) {
        Stock stock = stockRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Stock not found with id: " + id));
        return toDTO(stock);
    }

    public StockDTO getStockByDesignName(String designName) {
        Stock stock = stockRepository.findByDesignNameIgnoreCase(designName)
            .orElseThrow(() -> new RuntimeException("Stock not found: " + designName));
        return toDTO(stock);
    }

    public List<StockDTO> searchStocks(String searchTerm) {
        return stockRepository
            .findByDesignNameContainingIgnoreCaseOrSizeContainingIgnoreCaseOrTypeContainingIgnoreCase(
                searchTerm, searchTerm, searchTerm)
            .stream().map(this::toDTO).toList();
    }

    public List<StockDTO> getLowStockItems(Integer threshold) {
        return stockRepository.findByTotalBoxesLessThan(threshold)
            .stream().map(this::toDTO).toList();
    }

    public StockDTO createStock(StockDTO stockDTO) {
        Stock saved = stockRepository.save(toEntity(stockDTO));
        return toDTO(saved);
    }

    public StockDTO updateStock(Long id, StockDTO stockDTO) {
        Stock existing = stockRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Stock not found with id: " + id));
        existing.setDesignName(stockDTO.getDesignName());
        existing.setSize(stockDTO.getSize());
        existing.setType(stockDTO.getType());
        existing.setTotalBoxes(stockDTO.getTotalBoxes());
        existing.setPricePerBox(stockDTO.getPricePerBox());
        existing.setCategoryId(stockDTO.getCategoryId());
        return toDTO(stockRepository.save(existing));
    }

    public void deleteStock(Long id) {
        if (!stockRepository.existsById(id)) {
            throw new RuntimeException("Stock not found with id: " + id);
        }
        stockRepository.deleteById(id);
    }

    public Integer getTotalStocks() {
        return (int) stockRepository.count();
    }

    public Integer getLowStockCount(Integer threshold) {
        return (int) stockRepository.countByTotalBoxesLessThan(threshold);
    }
}