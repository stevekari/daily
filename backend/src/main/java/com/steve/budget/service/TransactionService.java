package com.steve.budget.service;

import com.steve.budget.dto.TransactionDTO;
import com.steve.budget.model.Transaction;
import com.steve.budget.model.User;
import com.steve.budget.repository.TransactionRepository;
import com.steve.budget.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * TransactionService
 *
 * Handles all transaction-related business logic
 */
@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    @Autowired
    public TransactionService(TransactionRepository transactionRepository,
                              UserRepository userRepository) {
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }

    // ════════════════════════════════════════════════════════════════════════════
    // USER-SCOPED METHODS
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * Add a new transaction for a user
     */
    public TransactionDTO addTransaction(TransactionDTO dto) {
        if (dto.getUserId() == null) {
            throw new RuntimeException("Transaction must include a valid userId");
        }

        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + dto.getUserId()));

        Transaction entity = new Transaction(
                user,
                dto.getName(),
                dto.getAmount(),
                dto.getDateTime() != null ? dto.getDateTime() : LocalDateTime.now(),
                dto.getType() != null ? dto.getType() : Transaction.TransactionType.EXPENSE,
                dto.getCategory(),
                dto.getDescription());

        Transaction saved = transactionRepository.save(entity);
        return toDTO(saved);
    }

    /**
     * Update an existing transaction
     */
    public TransactionDTO updateTransaction(Long id, TransactionDTO dto) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found with ID: " + id));

        if (dto.getName() != null && !dto.getName().isBlank()) {
            transaction.setName(dto.getName());
        }
        if (dto.getAmount() != null) {
            transaction.setAmount(dto.getAmount());
        }
        if (dto.getDateTime() != null) {
            transaction.setDateTime(dto.getDateTime());
        }
        if (dto.getType() != null) {
            transaction.setType(dto.getType());
        }
        if (dto.getCategory() != null) {
            transaction.setCategory(dto.getCategory());
        }
        if (dto.getDescription() != null) {
            transaction.setDescription(dto.getDescription());
        }

        Transaction updated = transactionRepository.save(transaction);
        return toDTO(updated);
    }

    /**
     * Get all transactions for a specific user
     */
    public List<TransactionDTO> getUserTransactions(Long userId) {
        if (userId == null || !userRepository.existsById(userId)) {
            return List.of();
        }

        return transactionRepository.findByUser_IdOrderByDateTimeDesc(userId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get today's transactions for a user
     */
    public List<TransactionDTO> getDailyTransactions(Long userId) {
        if (userId == null || !userRepository.existsById(userId)) {
            return List.of();
        }

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);

        return transactionRepository.findByUser_IdAndDateTimeBetweenOrderByDateTimeDesc(userId, startOfDay, endOfDay)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get last 7 days transactions for a user
     */
    public List<TransactionDTO> getWeeklyTransactions(Long userId) {
        if (userId == null || !userRepository.existsById(userId)) {
            return List.of();
        }

        LocalDateTime start = LocalDateTime.now().minusDays(7);
        LocalDateTime end = LocalDateTime.now();

        return transactionRepository.findByUser_IdAndDateTimeBetweenOrderByDateTimeDesc(userId, start, end)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get this month's transactions for a user
     */
    public List<TransactionDTO> getMonthlyTransactions(Long userId) {
        if (userId == null || !userRepository.existsById(userId)) {
            return List.of();
        }

        LocalDateTime start = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime end = LocalDateTime.now();

        return transactionRepository.findByUser_IdAndDateTimeBetweenOrderByDateTimeDesc(userId, start, end)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // ════════════════════════════════════════════════════════════════════════════
    // GLOBAL / BACKWARD-COMPATIBLE METHODS
    // ════════════════════════════════════════════════════════════════════════════

    public List<TransactionDTO> getAllTransactions() {
        return transactionRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<TransactionDTO> getDailyTransactionsAll() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);

        return transactionRepository.findByDateTimeBetweenOrderByDateTimeDesc(startOfDay, endOfDay)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<TransactionDTO> getWeeklyTransactionsAll() {
        LocalDateTime start = LocalDateTime.now().minusDays(7);
        LocalDateTime end = LocalDateTime.now();

        return transactionRepository.findByDateTimeBetweenOrderByDateTimeDesc(start, end)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<TransactionDTO> getMonthlyTransactionsAll() {
        LocalDateTime start = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime end = LocalDateTime.now();

        return transactionRepository.findByDateTimeBetweenOrderByDateTimeDesc(start, end)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // ════════════════════════════════════════════════════════════════════════════
    // DELETE
    // ════════════════════════════════════════════════════════════════════════════

    public void deleteTransaction(Long id) {
        transactionRepository.deleteById(id);
    }

    // ════════════════════════════════════════════════════════════════════════════
    // HELPER: Convert Entity → DTO
    // ════════════════════════════════════════════════════════════════════════════

    private TransactionDTO toDTO(Transaction t) {
        TransactionDTO dto = new TransactionDTO(
                t.getId(),
                t.getName(),
                t.getAmount(),
                t.getDateTime(),
                t.getType(),
                t.getCategory(),
                t.getDescription());
        if (t.getUser() != null) {
            dto.setUserId(t.getUser().getId());
        }
        return dto;
    }
}
