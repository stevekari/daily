package com.steve.budget.service;

import com.steve.budget.dto.CategoryDTO;
import com.steve.budget.model.Category;
import com.steve.budget.model.User;
import com.steve.budget.repository.CategoryRepository;
import com.steve.budget.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    @Autowired
    public CategoryService(CategoryRepository categoryRepository, UserRepository userRepository) {
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryDTO> getCategoriesForUser(Long userId) {
        List<Category> categories;
        if (userId != null && userId > 0) {
            categories = categoryRepository.findAllByUserIdOrGlobal(userId);
        } else {
            categories = categoryRepository.findByUserIsNull();
        }
        return categories.stream().map(this::toDTO).toList();
    }

    @Transactional
    public CategoryDTO createCategory(CategoryDTO dto, Long userId) {
        User user = null;
        if (userId != null && userId > 0) {
            user = userRepository.findById(userId).orElse(null);
        }

        Category.CategoryType type = Category.CategoryType.EXPENSE;
        if (dto.getType() != null && dto.getType().equalsIgnoreCase("INCOME")) {
            type = Category.CategoryType.INCOME;
        }

        Category category = new Category(
                user,
                dto.getName() != null ? dto.getName().trim() : "Custom Category",
                type,
                dto.getIcon() != null ? dto.getIcon() : "🏷️",
                dto.getColor() != null ? dto.getColor() : "#f97316",
                dto.getBudgetLimit()
        );

        Category saved = categoryRepository.save(category);
        return toDTO(saved);
    }

    @Transactional
    public Optional<CategoryDTO> updateCategory(Long id, CategoryDTO dto, Long userId) {
        Optional<Category> opt;
        if (userId != null) {
            opt = categoryRepository.findByIdAndUserId(id, userId);
        } else {
            opt = categoryRepository.findById(id);
        }

        if (opt.isEmpty()) {
            return Optional.empty();
        }

        Category category = opt.get();
        if (dto.getName() != null && !dto.getName().isBlank()) {
            category.setName(dto.getName().trim());
        }
        if (dto.getType() != null) {
            category.setType(dto.getType().equalsIgnoreCase("INCOME") ? Category.CategoryType.INCOME : Category.CategoryType.EXPENSE);
        }
        if (dto.getIcon() != null) {
            category.setIcon(dto.getIcon());
        }
        if (dto.getColor() != null) {
            category.setColor(dto.getColor());
        }
        if (dto.getBudgetLimit() != null) {
            category.setBudgetLimit(dto.getBudgetLimit());
        }

        Category updated = categoryRepository.save(category);
        return Optional.of(toDTO(updated));
    }

    @Transactional
    public boolean deleteCategory(Long id, Long userId) {
        Optional<Category> opt;
        if (userId != null) {
            opt = categoryRepository.findByIdAndUserId(id, userId);
        } else {
            opt = categoryRepository.findById(id);
        }

        if (opt.isPresent()) {
            categoryRepository.delete(opt.get());
            return true;
        }
        return false;
    }

    private CategoryDTO toDTO(Category c) {
        return new CategoryDTO(
                c.getId(),
                c.getUser() != null ? c.getUser().getId() : null,
                c.getName(),
                c.getType() != null ? c.getType().name() : "EXPENSE",
                c.getIcon(),
                c.getColor(),
                c.getBudgetLimit(),
                c.getCreatedAt() != null ? c.getCreatedAt() : LocalDateTime.now()
        );
    }
}

