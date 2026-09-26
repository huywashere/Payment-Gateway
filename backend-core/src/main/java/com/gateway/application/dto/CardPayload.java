package com.gateway.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardPayload {
    private String number;
    private String holderName;
    private Integer expMonth;
    private Integer expYear;
    private String cvc;
}
