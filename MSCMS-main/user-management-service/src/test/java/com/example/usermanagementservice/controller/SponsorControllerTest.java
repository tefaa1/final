package com.example.usermanagementservice.controller;

import com.example.usermanagementservice.dto.request.sponsorReq.SponsorRequest;
import com.example.usermanagementservice.dto.response.ApiResponse;
import com.example.usermanagementservice.dto.response.sponsorRes.SponsorResponse;
import com.example.usermanagementservice.dto.update.sponsorUp.SponsorUpdateRequest;
import com.example.usermanagementservice.model.enums.Gender;
import com.example.usermanagementservice.service.sponsorService.SponsorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class SponsorControllerTest {

    @Mock
    private SponsorService sponsorService;

    @InjectMocks
    private SponsorController controller;

    private SponsorRequest request;
    private SponsorUpdateRequest updateRequest;
    private SponsorResponse response;

    @BeforeEach
    void setUp() {
        request = new SponsorRequest();
        request.setUsername("sponsor1");
        request.setEmail("sponsor1@example.com");
        request.setPassword("password123");
        request.setFirstName("Steve");
        request.setLastName("Sponsor");
        request.setAge(50);
        request.setPhone("+1234567890");
        request.setAddress("123 Sponsor St");
        request.setGender(Gender.MALE);
        request.setCompanyName("SponsorCorp");

        updateRequest = new SponsorUpdateRequest();
        updateRequest.setFirstName("Steve");
        updateRequest.setLastName("Sponsor");
        updateRequest.setAge(50);
        updateRequest.setPhone("+1234567890");
        updateRequest.setAddress("123 Sponsor St");
        updateRequest.setGender(Gender.MALE);
        updateRequest.setCompanyName("SponsorCorp");

        response = SponsorResponse.builder()
                .id(1L)
                .keycloakId("sponsor-keycloak-1")
                .firstName("Steve")
                .lastName("Sponsor")
                .age(50)
                .email("sponsor1@example.com")
                .phone("+1234567890")
                .address("123 Sponsor St")
                .gender(Gender.MALE)
                .companyName("SponsorCorp")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void createSponsor_shouldReturnCreated() {
        given(sponsorService.createSponsor(any(SponsorRequest.class))).willReturn(response);

        ResponseEntity<ApiResponse<SponsorResponse>> result = controller.createSponsor(request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).isEqualTo(response);
        verify(sponsorService).createSponsor(eq(request));
    }

    @Test
    void getSponsorById_shouldReturnOk() {
        Long id = 1L;
        given(sponsorService.getSponsorById(id)).willReturn(response);

        ResponseEntity<ApiResponse<SponsorResponse>> result = controller.getSponsorById(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).isEqualTo(response);
        verify(sponsorService).getSponsorById(id);
    }

    @Test
    void getAllSponsors_shouldReturnList() {
        given(sponsorService.getAllSponsors()).willReturn(List.of(response));

        ResponseEntity<ApiResponse<List<SponsorResponse>>> result = controller.getAllSponsors();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).containsExactly(response);
        verify(sponsorService).getAllSponsors();
    }

    @Test
    void updateSponsor_shouldReturnOk() {
        Long id = 1L;
        given(sponsorService.updateSponsor(eq(id), any(SponsorUpdateRequest.class))).willReturn(response);

        ResponseEntity<ApiResponse<SponsorResponse>> result = controller.updateSponsor(id, updateRequest);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).isEqualTo(response);
        verify(sponsorService).updateSponsor(id, updateRequest);
    }
}
