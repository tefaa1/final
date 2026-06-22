package com.example.reportsanalyticsservice.repository;

import com.example.reportsanalyticsservice.model.entity.SponsorContractOffer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SponsorContractOfferRepository extends JpaRepository<SponsorContractOffer, Long> {
}
