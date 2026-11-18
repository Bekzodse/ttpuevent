package uz.university.uems.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CompleteRefundRequest {

    @NotNull(message = "Refund amount is required")
    @DecimalMin(value = "0.01", message = "Refund amount must be greater than zero")
    private BigDecimal refundAmount;

    @NotBlank(message = "Bank transaction reference is required")
    @Size(min = 3, max = 120, message = "Transaction reference must be between 3 and 120 characters")
    private String transactionRef;

    @Size(max = 1000)
    private String adminComment;
}
