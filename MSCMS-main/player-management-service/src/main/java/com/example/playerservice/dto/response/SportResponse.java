package com.example.playerservice.dto.response;

import com.example.playerservice.model.enums.SportType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SportResponse {
    private Long id;
    private String name;
    private Long sportManagerId;
    private SportType sportType;
}
