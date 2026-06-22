package com.example.notificationmessagingservice.controller;

import com.example.notificationmessagingservice.client.UserClient;
import com.example.notificationmessagingservice.model.entity.ChatGroup;
import com.example.notificationmessagingservice.model.entity.ChatGroupMember;
import com.example.notificationmessagingservice.model.enums.GroupMemberStatus;
import com.example.notificationmessagingservice.repository.ChatGroupMemberRepository;
import com.example.notificationmessagingservice.repository.ChatGroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Real chat-group system. Mounted at /messages/groups — a literal path segment,
 * so it takes precedence over MessageController's GET /messages/{id} (Spring
 * prefers literal patterns over {id}), and it routes through the existing
 * /messages/** gateway route with no gateway change.
 *
 * General group: the single isGeneral group is returned to everyone, and its
 * members resolve to ALL users (live from the user service). User-created groups
 * have explicit membership; invitees are INVITED until they accept.
 */
@RestController
@RequestMapping("/messages/groups")
@RequiredArgsConstructor
public class ChatGroupController {

    private final ChatGroupRepository groupRepo;
    private final ChatGroupMemberRepository memberRepo;
    private final UserClient userClient;

    // ---- request bodies ----
    public record CreateGroupReq(String name, String description, String photoUrl,
                                 String createdBy, List<String> memberKeycloakIds) {}
    public record InviteReq(List<String> userKeycloakIds, String invitedBy) {}

    // ---- responses ----
    public record MemberDto(String userKeycloakId, String status) {}
    public record GroupDto(Long id, String name, String description, String photoUrl,
                           boolean general, String createdBy, String myStatus,
                           List<MemberDto> members, LocalDateTime createdAt) {}

    /** Groups the user belongs to: the General group + every group where they are a MEMBER. */
    @GetMapping
    public List<GroupDto> myGroups(@RequestParam(required = false) String user) {
        List<GroupDto> out = new ArrayList<>();
        groupRepo.findByIsGeneralTrue().ifPresent(g -> out.add(toDto(g, user)));
        if (user != null && !user.isBlank()) {
            for (ChatGroupMember m : memberRepo.findByUserKeycloakIdAndStatus(user, GroupMemberStatus.MEMBER)) {
                groupRepo.findById(m.getGroupId()).ifPresent(g -> {
                    if (!Boolean.TRUE.equals(g.getIsGeneral())) out.add(toDto(g, user));
                });
            }
        }
        return out;
    }

    @GetMapping("/{id}")
    public ResponseEntity<GroupDto> getOne(@PathVariable Long id, @RequestParam(required = false) String user) {
        return groupRepo.findById(id).map(g -> ResponseEntity.ok(toDto(g, user)))
                .orElse(ResponseEntity.notFound().build());
    }

    /** Create a group. Creator becomes a MEMBER; everyone invited is INVITED until they accept. */
    @PostMapping
    public ResponseEntity<GroupDto> create(@RequestBody CreateGroupReq req) {
        ChatGroup g = new ChatGroup();
        g.setName(req.name());
        g.setDescription(req.description());
        g.setPhotoUrl(req.photoUrl());
        g.setCreatedByKeycloakId(req.createdBy());
        g.setIsGeneral(false);
        g.setCreatedAt(LocalDateTime.now());
        g = groupRepo.save(g);

        if (req.createdBy() != null && !req.createdBy().isBlank()) {
            saveMember(g.getId(), req.createdBy(), GroupMemberStatus.MEMBER, req.createdBy());
        }
        if (req.memberKeycloakIds() != null) {
            for (String u : req.memberKeycloakIds()) {
                if (u != null && !u.isBlank() && !u.equals(req.createdBy())) {
                    saveMember(g.getId(), u, GroupMemberStatus.INVITED, req.createdBy());
                }
            }
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(g, req.createdBy()));
    }

    /** Members of a group. For the General group this is EVERY user in the system. */
    @GetMapping("/{id}/members")
    public List<MemberDto> members(@PathVariable Long id) {
        ChatGroup g = groupRepo.findById(id).orElse(null);
        if (g != null && Boolean.TRUE.equals(g.getIsGeneral())) {
            try {
                var resp = userClient.getAllUsers();
                if (resp == null || resp.getData() == null) return List.of();
                return resp.getData().stream()
                        .filter(u -> u.getKeycloakId() != null)
                        .map(u -> new MemberDto(u.getKeycloakId(), "MEMBER"))
                        .collect(Collectors.toList());
            } catch (Exception e) {
                return List.of(); // frontend falls back to its own user directory for General
            }
        }
        return memberRepo.findByGroupId(id).stream()
                .map(m -> new MemberDto(m.getUserKeycloakId(), m.getStatus().name()))
                .collect(Collectors.toList());
    }

    /** Pending invitations for a user. */
    @GetMapping("/invitations")
    public List<GroupDto> invitations(@RequestParam String user) {
        List<GroupDto> out = new ArrayList<>();
        for (ChatGroupMember m : memberRepo.findByUserKeycloakIdAndStatus(user, GroupMemberStatus.INVITED)) {
            groupRepo.findById(m.getGroupId()).ifPresent(g -> out.add(toDto(g, user)));
        }
        return out;
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<Void> accept(@PathVariable Long id, @RequestParam String user) {
        memberRepo.findByGroupIdAndUserKeycloakId(id, user).ifPresent(m -> {
            m.setStatus(GroupMemberStatus.MEMBER);
            memberRepo.save(m);
        });
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/decline")
    public ResponseEntity<Void> decline(@PathVariable Long id, @RequestParam String user) {
        memberRepo.findByGroupIdAndUserKeycloakId(id, user).ifPresent(memberRepo::delete);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/invite")
    public ResponseEntity<Void> invite(@PathVariable Long id, @RequestBody InviteReq req) {
        if (req.userKeycloakIds() != null) {
            for (String u : req.userKeycloakIds()) {
                if (u != null && !u.isBlank() && memberRepo.findByGroupIdAndUserKeycloakId(id, u).isEmpty()) {
                    saveMember(id, u, GroupMemberStatus.INVITED, req.invitedBy());
                }
            }
        }
        return ResponseEntity.ok().build();
    }

    // ---- helpers ----
    private void saveMember(Long groupId, String user, GroupMemberStatus status, String invitedBy) {
        ChatGroupMember m = new ChatGroupMember();
        m.setGroupId(groupId);
        m.setUserKeycloakId(user);
        m.setStatus(status);
        m.setInvitedByKeycloakId(invitedBy);
        m.setCreatedAt(LocalDateTime.now());
        memberRepo.save(m);
    }

    private GroupDto toDto(ChatGroup g, String user) {
        boolean general = Boolean.TRUE.equals(g.getIsGeneral());
        String myStatus = general ? "MEMBER"
                : (user == null ? null
                : memberRepo.findByGroupIdAndUserKeycloakId(g.getId(), user)
                        .map(m -> m.getStatus().name()).orElse(null));
        List<MemberDto> mem = general ? List.of()
                : memberRepo.findByGroupId(g.getId()).stream()
                        .map(m -> new MemberDto(m.getUserKeycloakId(), m.getStatus().name()))
                        .collect(Collectors.toList());
        return new GroupDto(g.getId(), g.getName(), g.getDescription(), g.getPhotoUrl(),
                general, g.getCreatedByKeycloakId(), myStatus, mem, g.getCreatedAt());
    }
}
