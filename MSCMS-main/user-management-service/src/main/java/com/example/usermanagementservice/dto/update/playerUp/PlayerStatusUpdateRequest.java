package com.example.usermanagementservice.dto.update.playerUp;

import com.example.usermanagementservice.model.enums.StatusOfPlayer;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlayerStatusUpdateRequest {
    @NotNull(message = "Status is required")
    private StatusOfPlayer status;
}