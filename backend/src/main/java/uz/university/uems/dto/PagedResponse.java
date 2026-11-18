package uz.university.uems.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Generic paginated response envelope")
public class PagedResponse<T> {
    @Schema(description = "Page content items")
    private List<T> content;
    @Schema(description = "Total number of matching records", example = "42")
    private long totalElements;
    @Schema(description = "Total number of pages", example = "3")
    private int totalPages;
    @Schema(description = "Zero-based current page index", example = "0")
    private int number;
    @Schema(description = "Page size", example = "15")
    private int size;

    public static <T> PagedResponse<T> from(Page<T> page) {
        return PagedResponse.<T>builder()
                .content(page.getContent())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .number(page.getNumber())
                .size(page.getSize())
                .build();
    }
}
