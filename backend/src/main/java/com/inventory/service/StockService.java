package com.inventory.service;

import com.inventory.dto.StockDTO;
import com.inventory.model.Stock;
import com.inventory.repository.StockRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class StockService {
    
    private final StockRepository stockRepository;
    
    public StockService(StockRepository stockRepository) {
        this.stockRepository = stockRepository;
    }
    
    public List<StockDTO> getAllStocks() {
        return stockRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @SuppressWarnings("null")
    public StockDTO getStockById(Long id) {
        Stock stock = stockRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Stock not found with id: " + id));
        return convertToDTO(stock);
    }
    
    public StockDTO getStockByDesignName(String designName) {
        Stock stock = stockRepository.findByDesignName(designName)
                .orElseThrow(() -> new RuntimeException("Stock not found with design name: " + designName));
        return convertToDTO(stock);
    }
    
    public List<StockDTO> searchStocks(String searchTerm) {
        return stockRepository.searchStocks(searchTerm)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<StockDTO> getLowStockItems(Integer threshold) {
        return stockRepository.findLowStockItems(threshold)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @SuppressWarnings("null")
    public StockDTO createStock(StockDTO stockDTO) {
        Stock stock = convertToEntity(stockDTO);
        Stock savedStock = stockRepository.save(stock);
        return convertToDTO(savedStock);
    }
    
    @SuppressWarnings("null")
    public StockDTO updateStock(Long id, StockDTO stockDTO) {
        Stock stock = stockRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Stock not found with id: " + id));
        
        stock.setDesignName(stockDTO.getDesignName());
        stock.setSize(stockDTO.getSize());
        stock.setType(stockDTO.getType());
        stock.setTotalBoxes(stockDTO.getTotalBoxes());
        stock.setPricePerBox(stockDTO.getPricePerBox());
        
        Stock updatedStock = stockRepository.save(stock);
        return convertToDTO(updatedStock);
    }
    
    @SuppressWarnings("null")
    public void deleteStock(Long id) {
        Stock stock = stockRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Stock not found with id: " + id));
        stockRepository.delete(stock);
    }
    
    public Integer getTotalStocks() {
        return (int) stockRepository.count();
    }
    
    public Integer getLowStockCount(Integer threshold) {
        return stockRepository.findLowStockItems(threshold).size();
    }
    
    private StockDTO convertToDTO(Stock stock) {
        return new StockDTO(
                stock.getId(),
                stock.getDesignName(),
                stock.getSize(),
                stock.getType(),
                stock.getTotalBoxes(),
                stock.getPricePerBox(),
                stock.getCategoryId(),
                stock.getCreatedAt(),
                stock.getUpdatedAt()
        );
    }
    
    private Stock convertToEntity(StockDTO stockDTO) {
        return new Stock(
                stockDTO.getId(),
                stockDTO.getDesignName(),
                stockDTO.getSize(),
                stockDTO.getType(),
                stockDTO.getTotalBoxes(),
                stockDTO.getPricePerBox(),
                stockDTO.getCategoryId(),
                null,
                null
        );
    }
}
