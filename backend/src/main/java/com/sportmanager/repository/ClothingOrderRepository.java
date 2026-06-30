package com.sportmanager.repository;

import com.sportmanager.entity.ClothingOrder;
import com.sportmanager.entity.Registration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClothingOrderRepository extends JpaRepository<ClothingOrder, Long> {

    List<ClothingOrder> findByRegistration(Registration registration);

    boolean existsByRegistration(Registration registration);
}