package uz.university.uems.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.university.uems.entity.CancellationPolicy;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CancellationPolicyDto {
    private Long id;
    private String name;
    private Integer fullRefundHoursBefore;
    private Integer partialRefundHoursBefore;
    private Integer partialRefundPercent;
    private boolean releaseHallOnApproval;
    private String description;
    private Instant updatedAt;

    public static CancellationPolicyDto from(CancellationPolicy p) {
        return CancellationPolicyDto.builder()
                .id(p.getId())
                .name(p.getName())
                .fullRefundHoursBefore(p.getFullRefundHoursBefore())
                .partialRefundHoursBefore(p.getPartialRefundHoursBefore())
                .partialRefundPercent(p.getPartialRefundPercent())
                .releaseHallOnApproval(p.isReleaseHallOnApproval())
                .description(p.getDescription())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
