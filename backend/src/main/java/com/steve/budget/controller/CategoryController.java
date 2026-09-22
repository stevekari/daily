package com.steve.budget.controller;

import com.steve.budget.dto.CategoryDTO;
import com.steve.budget.security.UserPrincipal;
import com.steve.budget.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    @Autowired
    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    /**
     * GET /api/categories
     * Retrieve all categories (system defaults + user's custom categories)
     */
    @GetMapping
    public ResponseEntity<List<CategoryDTO>> getCategories(@AuthenticationPrincipal UserPrincipal principal) {
        Long userId = principal != null ? principal.getId() : null;
        List<CategoryDTO> list = categoryService.getCategoriesForUser(userId);
        return ResponseEntity.ok(list);
    }

    /**
     * POST /api/categories
     * Create a new custom category for the authenticated user
     */
    @PostMapping
    public ResponseEntity<CategoryDTO> createCategory(
            @RequestBody CategoryDTO dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long userId = principal != null ? principal.getId() : null;
        CategoryDTO created = categoryService.createCategory(dto, userId);
        return ResponseEntity.ok(created);
    }

    /**
     * PUT /api/categories/{id}
     * Update an existing custom category
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCategory(
            @PathVariable Long id,
            @RequestBody CategoryDTO dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long userId = principal != null ? principal.getId() : null;
        Optional<CategoryDTO> updated = categoryService.updateCategory(id, dto, userId);
        if (updated.isPresent()) {
            return ResponseEntity.ok(updated.get());
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * DELETE /api/categories/{id}
     * Delete a custom category
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCategory(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long userId = principal != null ? principal.getId() : null;
        boolean deleted = categoryService.deleteCategory(id, userId);
        if (deleted) {
            return ResponseEntity.ok(Map.of("success", true, "message", "Category deleted successfully"));
        }
        return ResponseEntity.notFound().build();
    }
}

