package com.example.trainingmatchservice.controller;

import com.example.trainingmatchservice.dto.request.MatchPerformanceReviewRequest;
import com.example.trainingmatchservice.dto.response.MatchPerformanceReviewResponse;
import com.example.trainingmatchservice.service.MatchPerformanceReviewService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class MatchPerformanceReviewControllerTest {

    @Mock
    private MatchPerformanceReviewService matchPerformanceReviewService;

    @InjectMocks
    private MatchPerformanceReviewController controller;

    private MatchPerformanceReviewRequest request;
    private MatchPerformanceReviewResponse response;

    @BeforeEach
    void setUp() {
        request = new MatchPerformanceReviewRequest(
                1L,
                1L,
                1L,
                "Analysis",
                "Strengths",
                "Weaknesses",
                "Improvements",
                8);

        response = new MatchPerformanceReviewResponse(
                1L,
                1L,
                1L,
                1L,
                "Analysis",
                "Strengths",
                "Weaknesses",
                "Improvements",
                8);
    }

    @Test
    void createReview_shouldReturnCreated() {
        given(matchPerformanceReviewService.createMatchPerformanceReview(any(MatchPerformanceReviewRequest.class)))
                .willReturn(response);

        ResponseEntity<MatchPerformanceReviewResponse> result = controller.createReview(request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isEqualTo(response);
        verify(matchPerformanceReviewService).createMatchPerformanceReview(request);
    }

    @Test
    void updateReview_shouldReturnOk() {
        Long id = 1L;
        given(matchPerformanceReviewService.updateMatchPerformanceReview(eq(id),
                any(MatchPerformanceReviewRequest.class))).willReturn(response);

        ResponseEntity<MatchPerformanceReviewResponse> result = controller.updateReview(id, request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(matchPerformanceReviewService).updateMatchPerformanceReview(id, request);
    }

    @Test
    void getReview_shouldReturnOk() {
        Long id = 1L;
        given(matchPerformanceReviewService.getMatchPerformanceReviewById(id)).willReturn(response);

        ResponseEntity<MatchPerformanceReviewResponse> result = controller.getReview(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(matchPerformanceReviewService).getMatchPerformanceReviewById(id);
    }

    @Test
    void getAllReviews_shouldReturnList() {
        given(matchPerformanceReviewService.getAllMatchPerformanceReviews()).willReturn(List.of(response));

        ResponseEntity<List<MatchPerformanceReviewResponse>> result = controller.getAllReviews();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).containsExactly(response);
        verify(matchPerformanceReviewService).getAllMatchPerformanceReviews();
    }

    @Test
    void deleteReview_shouldReturnNoContent() {
        Long id = 1L;

        ResponseEntity<Void> result = controller.deleteReview(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(matchPerformanceReviewService).deleteMatchPerformanceReview(id);
    }
}
