package com.example.notificationmessagingservice.repository;

import com.example.notificationmessagingservice.model.entity.ChatGroupMember;
import com.example.notificationmessagingservice.model.enums.GroupMemberStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatGroupMemberRepository extends JpaRepository<ChatGroupMember, Long> {
    List<ChatGroupMember> findByUserKeycloakIdAndStatus(String userKeycloakId, GroupMemberStatus status);
    List<ChatGroupMember> findByGroupId(Long groupId);
    Optional<ChatGroupMember> findByGroupIdAndUserKeycloakId(Long groupId, String userKeycloakId);
}
