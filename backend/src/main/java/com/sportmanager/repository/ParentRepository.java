package com.sportmanager.repository;

import com.sportmanager.entity.Parent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ParentRepository extends JpaRepository<Parent, Long> {

    Optional<Parent> findByPhoneNumber(String phoneNumber);

    boolean existsByPhoneNumber(String phoneNumber);

    boolean existsByPhoneNumberAndIdNot(String phoneNumber, Long id);

    @Query("""
            SELECT p FROM Parent p
            WHERE (:search IS NULL OR :search = ''
                OR LOWER(p.firstName) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(p.lastName) LIKE LOWER(CONCAT('%', :search, '%'))
                OR p.phoneNumber LIKE CONCAT('%', :search, '%'))
              AND (:isKibbutzMember IS NULL OR p.isKibbutzMember = :isKibbutzMember)
            ORDER BY p.lastName, p.firstName
            """)
    List<Parent> search(
            @Param("search") String search,
            @Param("isKibbutzMember") Boolean isKibbutzMember
    );
}
