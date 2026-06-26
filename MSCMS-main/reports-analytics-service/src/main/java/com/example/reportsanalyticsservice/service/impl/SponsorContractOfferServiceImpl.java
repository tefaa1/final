package com.example.reportsanalyticsservice.service.impl;

import com.example.reportsanalyticsservice.dto.request.SponsorContractOfferRequest;
import com.example.reportsanalyticsservice.dto.request.SponsorOfferNegotiateRequest;
import com.example.reportsanalyticsservice.dto.response.SponsorContractOfferResponse;
import com.example.reportsanalyticsservice.exception.custom.BusinessException;
import com.example.reportsanalyticsservice.exception.custom.ResourceNotFoundException;
import com.example.reportsanalyticsservice.mapper.SponsorContractOfferMapper;
import com.example.reportsanalyticsservice.model.entity.SponsorContractOffer;
import com.example.reportsanalyticsservice.repository.SponsorContractOfferRepository;
import com.example.reportsanalyticsservice.service.SponsorContractOfferService;
import com.example.reportsanalyticsservice.service.token.TokenService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SponsorContractOfferServiceImpl implements SponsorContractOfferService {

    // ── Status & turn constants ──────────────────────────────────────────────
    private static final String STATUS_PENDING     = "PENDING";
    private static final String STATUS_NEGOTIATING = "NEGOTIATING";
    private static final String STATUS_ACCEPTED    = "ACCEPTED";
    private static final String STATUS_REJECTED    = "REJECTED";

    private static final String TURN_ADMIN   = "ADMIN";
    private static final String TURN_SPONSOR = "SPONSOR";

    private static final String ROLE_ADMIN   = "ADMIN";

    private final SponsorContractOfferRepository repository;
    private final SponsorContractOfferMapper mapper;
    private final TokenService tokenService;

    // ── CRUD ─────────────────────────────────────────────────────────────────

    @Override
    public SponsorContractOfferResponse create(SponsorContractOfferRequest request, HttpServletRequest http) {
        SponsorContractOffer entity = mapper.toEntity(request);
        // The sponsor that creates the offer owns it. Stamp the caller as owner
        // so we never trust a client-supplied sponsorKeycloakId.
        String caller = callerId(http);
        if (caller != null) entity.setSponsorKeycloakId(caller);
        // A freshly created offer always starts PENDING with the ball in the
        // admin's court — the sponsor just waits.
        entity.setStatus(STATUS_PENDING);
        entity.setCurrentTurn(TURN_ADMIN);
        entity.setNegotiatedAmount(null);
        entity.setRespondedAt(null);
        entity.setEndDate(null);
        if (entity.getOfferedAt() == null) entity.setOfferedAt(LocalDateTime.now());
        SponsorContractOffer saved = repository.save(entity);
        return toVisibleResponse(saved, http);
    }

    @Override
    public SponsorContractOfferResponse update(Long id, SponsorContractOfferRequest request, HttpServletRequest http) {
        SponsorContractOffer entity = findEntity(id);
        // Plain edits (terms/notes/duration metadata) are reserved for the admin;
        // lifecycle changes go through accept/reject/negotiate. Never let an
        // update silently overwrite owner, status or turn.
        requireAdmin(http);
        if (isTerminal(entity.getStatus())) {
            throw new BusinessException("A " + entity.getStatus() + " offer can no longer be edited");
        }
        String owner = entity.getSponsorKeycloakId();
        String status = entity.getStatus();
        String turn = entity.getCurrentTurn();
        mapper.updateFromRequest(request, entity);
        // Restore the protected fields the mapper may have touched.
        entity.setSponsorKeycloakId(owner);
        entity.setStatus(status);
        entity.setCurrentTurn(turn);
        return toVisibleResponse(repository.save(entity), http);
    }

    @Override
    public void delete(Long id) { repository.delete(findEntity(id)); }

    @Override
    @Transactional(readOnly = true)
    public SponsorContractOfferResponse getById(Long id, HttpServletRequest http) {
        return toVisibleResponse(findEntity(id), http);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SponsorContractOfferResponse> getAll(HttpServletRequest http) {
        String caller = callerId(http);
        boolean admin = isAdmin(http);
        return repository.findAll().stream()
                // A sponsor sees ONLY the offers they own; admin & every other
                // role can see the full list (money is hidden later for non-owners).
                .filter(o -> admin || isSponsorRole(http) == false || isOwner(o, caller))
                .map(o -> toVisibleResponse(o, http))
                .toList();
    }

    // ── Lifecycle transitions ────────────────────────────────────────────────

    @Override
    public SponsorContractOfferResponse accept(Long id, HttpServletRequest http) {
        SponsorContractOffer offer = findEntity(id);
        authorizeTurn(offer, http);
        offer.setStatus(STATUS_ACCEPTED);
        offer.setCurrentTurn(null);
        offer.setRespondedAt(LocalDateTime.now());
        // Derive the contract end date so the UI can flag it "Ended" later.
        Integer months = offer.getContractDurationMonths();
        offer.setEndDate(months != null ? LocalDateTime.now().plusMonths(months) : null);
        return toVisibleResponse(repository.save(offer), http);
    }

    @Override
    public SponsorContractOfferResponse reject(Long id, HttpServletRequest http) {
        SponsorContractOffer offer = findEntity(id);
        authorizeTurn(offer, http);
        offer.setStatus(STATUS_REJECTED);
        offer.setCurrentTurn(null);
        offer.setRespondedAt(LocalDateTime.now());
        return toVisibleResponse(repository.save(offer), http);
    }

    @Override
    public SponsorContractOfferResponse negotiate(Long id, SponsorOfferNegotiateRequest request, HttpServletRequest http) {
        SponsorContractOffer offer = findEntity(id);
        authorizeTurn(offer, http);
        offer.setStatus(STATUS_NEGOTIATING);
        offer.setNegotiatedAmount(request.amount());
        if (request.terms() != null && !request.terms().isBlank()) offer.setTerms(request.terms());
        // Counter passes the ball to the other party.
        boolean admin = isAdmin(http);
        offer.setCurrentTurn(admin ? TURN_SPONSOR : TURN_ADMIN);
        offer.setRespondedAt(LocalDateTime.now());
        // Append the counter to the running notes thread for an audit trail.
        String who = admin ? "Admin" : "Sponsor";
        String note = "[" + LocalDateTime.now() + "] " + who + " counter: " + request.amount()
                + (request.message() != null && !request.message().isBlank() ? " — " + request.message() : "");
        offer.setNotes(offer.getNotes() == null || offer.getNotes().isBlank()
                ? note : offer.getNotes() + "\n" + note);
        return toVisibleResponse(repository.save(offer), http);
    }

    // ── Authorization helpers ────────────────────────────────────────────────

    // Caller must be the admin or the owning sponsor, AND it must be their turn,
    // AND the offer must not already be in a terminal state.
    private void authorizeTurn(SponsorContractOffer offer, HttpServletRequest http) {
        if (isTerminal(offer.getStatus())) {
            throw new BusinessException("This offer is " + offer.getStatus() + " and can no longer be changed");
        }
        boolean admin = isAdmin(http);
        boolean owner = isOwner(offer, callerId(http));
        if (!admin && !owner) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed to act on this offer");
        }
        String turn = offer.getCurrentTurn();
        boolean myTurn = admin ? TURN_ADMIN.equalsIgnoreCase(turn) : TURN_SPONSOR.equalsIgnoreCase(turn);
        if (!myTurn) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "It is not your turn to act on this offer");
        }
    }

    private void requireAdmin(HttpServletRequest http) {
        if (!isAdmin(http)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only an admin can edit an offer directly");
        }
    }

    // ── Visibility / money-hiding ────────────────────────────────────────────

    // Admin and the owning sponsor see the money; every other caller gets the
    // amounts nulled out (they still see sponsor + team + duration + dates).
    private SponsorContractOfferResponse toVisibleResponse(SponsorContractOffer entity, HttpServletRequest http) {
        SponsorContractOfferResponse dto = mapper.toResponse(entity);
        boolean canSeeMoney = isAdmin(http) || isOwner(entity, callerId(http));
        if (canSeeMoney) return dto;
        return new SponsorContractOfferResponse(
                dto.id(),
                dto.sponsorKeycloakId(),
                dto.teamId(),
                null,            // offerAmount hidden
                dto.contractDurationMonths(),
                null,            // negotiatedAmount hidden
                dto.terms(),
                dto.status(),
                dto.currentTurn(),
                dto.offeredAt(),
                dto.respondedAt(),
                dto.endDate(),
                dto.notes()
        );
    }

    // ── Identity / role helpers (mirror TokenService usage in this service) ───

    private String callerId(HttpServletRequest http) {
        try { return tokenService.extractUserId(http); }
        catch (Exception e) { return null; }
    }

    private String callerRole(HttpServletRequest http) {
        try { return tokenService.extractUserRole(http); }
        catch (Exception e) { return null; }
    }

    private boolean isAdmin(HttpServletRequest http) {
        return hasRole(http, ROLE_ADMIN);
    }

    private boolean isSponsorRole(HttpServletRequest http) {
        return hasRole(http, TURN_SPONSOR);
    }

    // The caller's role claim may be a single value ("ADMIN"), a "ROLE_"-prefixed
    // value ("ROLE_ADMIN"), or a comma/space-separated list of realm roles
    // ("ADMIN,SPONSOR"). Treat all of these uniformly and case-insensitively.
    private boolean hasRole(HttpServletRequest http, String wanted) {
        String raw = callerRole(http);
        if (raw == null || wanted == null) return false;
        for (String token : raw.split("[,\\s]+")) {
            if (wanted.equalsIgnoreCase(stripRolePrefix(token))) return true;
        }
        return false;
    }

    private boolean isOwner(SponsorContractOffer offer, String callerId) {
        return callerId != null && callerId.equals(offer.getSponsorKeycloakId());
    }

    private boolean isTerminal(String status) {
        return STATUS_ACCEPTED.equalsIgnoreCase(status) || STATUS_REJECTED.equalsIgnoreCase(status);
    }

    private String stripRolePrefix(String role) {
        if (role == null) return null;
        String trimmed = role.trim();
        return trimmed.startsWith("ROLE_") ? trimmed.substring(5) : trimmed;
    }

    private SponsorContractOffer findEntity(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SponsorContractOffer not found with id " + id));
    }
}
