package com.example.usermanagementservice.mapper;
import com.example.usermanagementservice.dto.response.userRes.UserResponse;
import com.example.usermanagementservice.dto.update.userUp.UserUpdateRequest;
import com.example.usermanagementservice.model.entity.User;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface UserMapper {
    UserResponse toResponse(User user);
    List<UserResponse> toResponseList(List<User> users);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateUserFromDto(UserUpdateRequest dto, @MappingTarget User entity);
}

