package com.sportmanager.service;

import com.sportmanager.enums.ActivityType;
import com.sportmanager.repository.PaymentRepository;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class KibbutzExportServiceRtlTest {

    @Mock
    private PaymentRepository paymentRepository;

    @InjectMocks
    private KibbutzExportService kibbutzExportService;

    @BeforeEach
    void setUp() {
        lenient().when(paymentRepository.findKibbutzExportPayments(any(), any(), any(), any(), any()))
                .thenReturn(List.of());
        lenient().when(paymentRepository.findKibbutzClothingExportPayments(any(), any(), any(), any()))
                .thenReturn(List.of());
    }

    @Test
    void sportExport_opensSheetRightToLeft() throws Exception {
        assertWorkbookIsRtl(kibbutzExportService.exportMonthlyKibbutzBilling(
                2026, 9, ActivityType.FOOTBALL));
    }

    @Test
    void clothingExport_opensSheetRightToLeft() throws Exception {
        assertWorkbookIsRtl(kibbutzExportService.exportMonthlyKibbutzClothingBilling(2026, 9));
    }

    private static void assertWorkbookIsRtl(byte[] bytes) throws Exception {
        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(bytes))) {
            XSSFSheet sheet = workbook.getSheetAt(0);
            assertThat(sheet.isRightToLeft()).isTrue();
            assertThat(sheet.getCTWorksheet().getSheetViews().getSheetViewArray(0).getRightToLeft())
                    .isTrue();
        }

        String sheetXml = zipEntry(bytes, "xl/worksheets/sheet1.xml");
        assertThat(sheetXml).containsPattern("rightToLeft=\"(1|true)\"");

        String workbookXml = zipEntry(bytes, "xl/workbook.xml");
        assertThat(workbookXml).containsPattern("rtl=\"(1|true)\"");
    }

    private static String zipEntry(byte[] xlsx, String name) throws Exception {
        try (ZipInputStream in = new ZipInputStream(new ByteArrayInputStream(xlsx))) {
            ZipEntry entry;
            while ((entry = in.getNextEntry()) != null) {
                if (name.equals(entry.getName())) {
                    return new String(in.readAllBytes(), StandardCharsets.UTF_8);
                }
            }
        }
        throw new AssertionError("missing zip entry: " + name);
    }
}
