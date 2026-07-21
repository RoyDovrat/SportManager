package com.sportmanager.repository;

import com.sportmanager.entity.ClothingOrder;
import com.sportmanager.entity.Registration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClothingOrderRepository extends JpaRepository<ClothingOrder, Long> {

    List<ClothingOrder> findByRegistration(Registration registration);

    boolean existsByRegistration(Registration registration);

    Optional<ClothingOrder> findByRegistrationId(Long registrationId);

    List<ClothingOrder> findByRegistration_Season_Id(Long seasonId);

    List<ClothingOrder> findByRegistration_Student_IdentityNumber(String identityNumber);
}
