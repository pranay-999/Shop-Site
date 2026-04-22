package com.inventory.service;

import java.util.List;

import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.inventory.dto.StockDTO;
import com.inventory.model.Stock;
import com.inventory.repository.StockRepository;

@Service
public class StockService {

    private final StockRepository stockRepository;

    public StockService(StockRepository stockRepository) {
        this.stockRepository = stockRepository;
    }

    private StockDTO toDTO(Stock stock) {
        return new StockDTO(
            stock.getId(), stock.getDesignName(), stock.getSize(), stock.getType(),
            stock.getInitialBoxes(), stock.getSoldBoxes(), stock.getTotalBoxes(),
            stock.getPricePerBox(), stock.getCategoryId(),
            stock.getCreatedAt(), stock.getUpdatedAt()
        );
    }

    private Stock toEntity(StockDTO dto) {
        Stock s = new Stock();
        s.setDesignName(dto.getDesignName());
        s.setSize(dto.getSize());
        s.setType(dto.getType());
        int boxes = dto.getTotalBoxes() == null ? 0 : dto.getTotalBoxes();
        s.setTotalBoxes(boxes);
        s.setInitialBoxes(boxes);
        s.setSoldBoxes(0);
        s.setPricePerBox(dto.getPricePerBox());
        s.setCategoryId(dto.getCategoryId());
        return s;
    }

    public List<StockDTO> getAllStocks() {
        return stockRepository.findAll().stream().map(this::toDTO).toList();
    }

    public StockDTO getStockById(@NonNull Long id) {
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

    @Transactional
    public StockDTO createStock(StockDTO stockDTO) {
        Stock saved = stockRepository.save(toEntity(stockDTO));
        return toDTO(saved);
    }

    @Transactional
    public StockDTO updateStock(@NonNull Long id, StockDTO stockDTO) {
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

    /**
     * Adjusts stock by a delta value.
     * Positive delta = adding boxes back (e.g. item removed from bill).
     * Negative delta = removing boxes (e.g. item added to bill).
     * This is called directly from the frontend as a fallback.
     */
    @Transactional
    public StockDTO adjustStock(@NonNull Long id, int delta) {
        Stock stock = stockRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Stock not found with id: " + id));
        int currentTotal = stock.getTotalBoxes() == null ? 0 : stock.getTotalBoxes();
        int currentSold  = stock.getSoldBoxes()  == null ? 0 : stock.getSoldBoxes();
        // delta > 0 means returning boxes → totalBoxes up, soldBoxes down
        // delta < 0 means selling boxes  → totalBoxes down, soldBoxes up
        stock.setTotalBoxes(Math.max(0, currentTotal + delta));
        stock.setSoldBoxes(Math.max(0, currentSold - delta));
        return toDTO(stockRepository.save(stock));
    }

    @Transactional
    public void deleteStock(@NonNull Long id) {
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