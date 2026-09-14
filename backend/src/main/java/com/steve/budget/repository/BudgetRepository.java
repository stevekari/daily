package com.steve.budget.repository;

import com.steve.budget.model.Budget;
import com.steve.budget.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {

    List<Budget> findByUser(User user);
    List<Budget> findByUser_Id(Long userId);
    List<Budget> findByUser_IdOrderByCreatedAtDesc(Long userId);

    Optional<Budget> findFirstByUserOrderByCreatedAtDesc(User user);
    Optional<Budget> findFirstByUser_IdOrderByCreatedAtDesc(Long userId);

    Optional<Budget> findByUserAndName(User user, String name);
}