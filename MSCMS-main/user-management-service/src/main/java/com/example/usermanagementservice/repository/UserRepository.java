package com.example.usermanagementservice.repository;
import com.example.usermanagementservice.model.entity.User;
import com.example.usermanagementservice.model.enums.Gender;
import com.example.usermanagementservice.model.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByKeycloakId(String keycloakId);
    boolean existsByKeycloakId(String keycloakId);
    boolean existsByEmail(String email);
    List<User> findByRole(Role role);

    @Query("SELECT u.role as role, COUNT(u) as count FROM User u GROUP BY u.role")
    List<Object[]> countUsersByRole();

    Optional<User> findByEmail(String adminEmail);

    @Query("SELECT u FROM User u WHERE " +
           "(CAST(:firstName AS string) IS NULL OR LOWER(u.firstName) LIKE LOWER(CONCAT('%', CAST(:firstName AS string), '%'))) AND " +
           "(CAST(:lastName AS string) IS NULL OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', CAST(:lastName AS string), '%'))) AND " +
           "(CAST(:email AS string) IS NULL OR LOWER(u.email) LIKE LOWER(CONCAT('%', CAST(:email AS string), '%'))) AND " +
           "(:gender IS NULL OR u.gender = :gender) AND " +
           "(:role IS NULL OR u.role = :role) AND " +
           "(:minAge IS NULL OR u.age >= :minAge) AND " +
           "(:maxAge IS NULL OR u.age <= :maxAge)")
    List<User> searchUsers(@Param("firstName") String firstName,
                           @Param("lastName") String lastName,
                           @Param("email") String email,
                           @Param("gender") Gender gender,
                           @Param("role") Role role,
                           @Param("minAge") Integer minAge,
                           @Param("maxAge") Integer maxAge);
}