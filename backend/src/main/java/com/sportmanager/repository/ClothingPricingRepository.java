package com.sportmanager.repository;

import com.sportmanager.entity.ClothingPricing;
import com.sportmanager.entity.Season;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ClothingPricingRepository extends JpaRepository<ClothingPricing, Long> {

    Optional<ClothingPricing> findBySeason(Season season);

    Optional<ClothingPricing> findBySeasonId(Long seasonId);

    boolean existsBySeason(Season season);
}