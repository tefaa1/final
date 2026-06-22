package com.example.reportsanalyticsservice.controller;

import com.example.reportsanalyticsservice.dto.request.SponsorContractOfferRequest;
import com.example.reportsanalyticsservice.dto.response.SponsorContractOfferResponse;
import com.example.reportsanalyticsservice.service.SponsorContractOfferService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SponsorContractOfferControllerTest {

    @Mock
    private SponsorContractOfferService sponsorContractOfferService;

    @InjectMocks
    private SponsorContractOfferController sponsorContractOfferController;

    @Test
    void testCreateSponsorContractOffer() {
        // Given
        SponsorContractOfferRequest request = new SponsorContractOfferRequest(
                "sponsor-keycloak-id-1",
                1L,
                5000000.0,
                36,
                "Standard terms and conditions",
                "PENDING",
                LocalDateTime.of(2025, 7, 1, 0, 0),
                null,
                "Exclusive kit sponsorship for 3 years"
        );

        SponsorContractOfferResponse response = new SponsorContractOfferResponse(
                1L,
                "sponsor-keycloak-id-1",
                1L,
                5000000.0,
                36,
                "Standard terms and conditions",
                "PENDING",
                LocalDateTime.of(2025, 7, 1, 0, 0),
                null,
                "Exclusive kit sponsorship for 3 years"
        );

        given(sponsorContractOfferService.create(request)).willReturn(response);

        // When
        ResponseEntity<SponsorContractOfferResponse> result = sponsorContractOfferController.create(request);

        // Then
        assertThat(result.getStatusCodeValue()).isEqualTo(201);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().id()).isEqualTo(1L);
        assertThat(result.getBody().sponsorKeycloakId()).isEqualTo("sponsor-keycloak-id-1");
        assertThat(result.getBody().offerAmount()).isEqualTo(5000000.0);
        verify(sponsorContractOfferService, times(1)).create(request);
    }

    @Test
    void testUpdateSponsorContractOffer() {
        // Given
        Long id = 1L;
        SponsorContractOfferRequest request = new SponsorContractOfferRequest(
                "sponsor-keycloak-id-1",
                1L,
                6000000.0,
                36,
                "Updated terms and conditions",
                "APPROVED",
                LocalDateTime.of(2025, 7, 1, 0, 0),
                LocalDateTime.of(2025, 7, 15, 0, 0),
                "Enhanced kit sponsorship for 3 years"
        );

        SponsorContractOfferResponse response = new SponsorContractOfferResponse(
                1L,
                "sponsor-keycloak-id-1",
                1L,
                6000000.0,
                36,
                "Updated terms and conditions",
                "APPROVED",
                LocalDateTime.of(2025, 7, 1, 0, 0),
                LocalDateTime.of(2025, 7, 15, 0, 0),
                "Enhanced kit sponsorship for 3 years"
        );

        given(sponsorContractOfferService.update(id, request)).willReturn(response);

        // When
        ResponseEntity<SponsorContractOfferResponse> result = sponsorContractOfferController.update(id, request);

        // Then
        assertThat(result.getStatusCodeValue()).isEqualTo(200);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().id()).isEqualTo(1L);
        assertThat(result.getBody().offerAmount()).isEqualTo(6000000.0);
        assertThat(result.getBody().status()).isEqualTo("APPROVED");
        verify(sponsorContractOfferService, times(1)).update(id, request);
    }

    @Test
    void testGetSponsorContractOfferById() {
        // Given
        Long id = 1L;
        SponsorContractOfferResponse response = new SponsorContractOfferResponse(
                1L,
                "sponsor-keycloak-id-1",
                1L,
                5000000.0,
                36,
                "Standard terms and conditions",
                "PENDING",
                LocalDateTime.of(2025, 7, 1, 0, 0),
                null,
                "Exclusive kit sponsorship for 3 years"
        );

        given(sponsorContractOfferService.getById(id)).willReturn(response);

        // When
        ResponseEntity<SponsorContractOfferResponse> result = sponsorContractOfferController.getById(id);

        // Then
        assertThat(result.getStatusCodeValue()).isEqualTo(200);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().id()).isEqualTo(1L);
        verify(sponsorContractOfferService, times(1)).getById(id);
    }

    @Test
    void testGetAllSponsorContractOffers() {
        // Given
        SponsorContractOfferResponse response1 = new SponsorContractOfferResponse(
                1L,
                "sponsor-keycloak-id-1",
                1L,
                5000000.0,
                36,
                "Standard terms and conditions",
                "PENDING",
                LocalDateTime.of(2025, 7, 1, 0, 0),
                null,
                "Exclusive kit sponsorship for 3 years"
        );

        SponsorContractOfferResponse response2 = new SponsorContractOfferResponse(
                2L,
                "sponsor-keycloak-id-2",
                1L,
                10000000.0,
                60,
                "Premium terms and conditions",
                "APPROVED",
                LocalDateTime.of(2025, 8, 1, 0, 0),
                LocalDateTime.of(2025, 8, 15, 0, 0),
                "Stadium naming rights for 5 years"
        );

        List<SponsorContractOfferResponse> responses = Arrays.asList(response1, response2);
        given(sponsorContractOfferService.getAll()).willReturn(responses);

        // When
        ResponseEntity<List<SponsorContractOfferResponse>> result = sponsorContractOfferController.getAll();

        // Then
        assertThat(result.getStatusCodeValue()).isEqualTo(200);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody()).hasSize(2);
        verify(sponsorContractOfferService, times(1)).getAll();
    }

    @Test
    void testDeleteSponsorContractOffer() {
        // Given
        Long id = 1L;
        doNothing().when(sponsorContractOfferService).delete(id);

        // When
        ResponseEntity<Void> result = sponsorContractOfferController.delete(id);

        // Then
        assertThat(result.getStatusCodeValue()).isEqualTo(204);
        verify(sponsorContractOfferService, times(1)).delete(id);
    }
}
