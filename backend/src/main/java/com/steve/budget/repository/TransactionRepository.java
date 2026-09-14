package com.steve.budget.repository;

import com.steve.budget.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findByUser_IdOrderByDateTimeDesc(Long userId);

    List<Transaction> findByUser_IdAndDateTimeBetweenOrderByDateTimeDesc(
            Long userId,
            LocalDateTime start,
            LocalDateTime end
    );

    List<Transaction> findByDateTimeBetweenOrderByDateTimeDesc(
            LocalDateTime start,
            LocalDateTime end
    );

    @Query("SELECT t FROM Transaction t WHERE t.dateTime >= :start ORDER BY t.dateTime DESC")
    List<Transaction> findRecentTransactions(@Param("start") LocalDateTime start);

    @Query("SELECT SUM(t.amount) " +
            "FROM Transaction t " +
            "WHERE t.type = com.steve.budget.model.Transaction.TransactionType.EXPENSE " +
            "AND t.dateTime BETWEEN :start AND :end")
    BigDecimal sumExpensesBetween(
            @Param("start") LocalDateTime start,
            @Param("end")   LocalDateTime end
    );

    @Query("SELECT SUM(t.amount) " +
            "FROM Transaction t " +
            "WHERE t.user.id = :userId " +
            "AND t.type = com.steve.budget.model.Transaction.TransactionType.EXPENSE " +
            "AND t.dateTime BETWEEN :start AND :end")
    BigDecimal sumExpensesForUserBetween(
            @Param("userId") Long userId,
            @Param("start") LocalDateTime start,
            @Param("end")   LocalDateTime end
    );
}
