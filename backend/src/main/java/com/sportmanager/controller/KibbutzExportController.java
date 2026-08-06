package com.sportmanager.controller;

import com.sportmanager.enums.ActivityType;
import com.sportmanager.service.KibbutzExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/exports")
@RequiredArgsConstructor
public class KibbutzExportController {

    private final KibbutzExportService kibbutzExportService;

    @GetMapping("/kibbutz")
    public ResponseEntity<byte[]> exportKibbutzBilling(
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam ActivityType activityType
    ) {
        byte[] fileContent = kibbutzExportService.exportMonthlyKibbutzBilling(
                year,
                month,
                activityType
        );
        String fileName = kibbutzExportService.buildFileName(year, month, activityType);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                ))
                .contentLength(fileContent.length)
                .body(fileContent);
    }
}
