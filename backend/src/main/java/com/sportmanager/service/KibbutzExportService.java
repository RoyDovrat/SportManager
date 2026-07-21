package com.sportmanager.service;

import com.sportmanager.entity.Parent;
import com.sportmanager.entity.Payment;
import com.sportmanager.entity.Student;
import com.sportmanager.enums.PaymentMethod;
import com.sportmanager.enums.PaymentStatus;
import com.sportmanager.exception.BusinessRuleException;
import com.sportmanager.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
public class KibbutzExportService {

    private final PaymentRepository paymentRepository;

    @Transactional(readOnly = true)
    public byte[] exportMonthlyKibbutzBilling(int year, int month) {
        validateYearMonth(year, month);

        LocalDate chargeMonth = LocalDate.of(year, month, 1);
        List<Payment> payments = paymentRepository.findKibbutzExportPayments(
                PaymentStatus.PENDING,
                PaymentMethod.KIBBUTZ_BUDGET,
                chargeMonth
        );

        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Kibbutz Billing");
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle totalStyle = createTotalStyle(workbook);

            createHeaderRow(sheet, headerStyle);

            BigDecimal total = BigDecimal.ZERO;
            int rowIndex = 1;

            for (Payment payment : payments) {
                Student student = payment.getRegistration().getStudent();
                Parent parent = student.getParent();

                Row row = sheet.createRow(rowIndex++);
                row.createCell(0).setCellValue(formatName(parent.getFirstName(), parent.getLastName()));
                row.createCell(1).setCellValue(formatName(student.getFirstName(), student.getLastName()));
                row.createCell(2).setCellValue(
                        parent.getBudgetNumber() != null ? parent.getBudgetNumber() : ""
                );
                row.createCell(3).setCellValue(payment.getAmount().doubleValue());

                total = total.add(payment.getAmount());
            }

            Row totalRow = sheet.createRow(rowIndex);
            Cell totalLabelCell = totalRow.createCell(0);
            totalLabelCell.setCellValue("Monthly Total");
            totalLabelCell.setCellStyle(totalStyle);

            Cell totalValueCell = totalRow.createCell(3);
            totalValueCell.setCellValue(total.doubleValue());
            totalValueCell.setCellStyle(totalStyle);

            for (int i = 0; i < 4; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (IOException ex) {
            throw new BusinessRuleException("Failed to generate Kibbutz Excel export");
        }
    }

    public String buildFileName(int year, int month) {
        return "kibbutz-billing-%04d-%02d.xlsx".formatted(year, month);
    }

    private void validateYearMonth(int year, int month) {
        if (year < 2000 || year > 2100) {
            throw new BusinessRuleException("Year must be between 2000 and 2100");
        }
        try {
            YearMonth.of(year, month);
        } catch (Exception ex) {
            throw new BusinessRuleException("Month must be between 1 and 12");
        }
    }

    private void createHeaderRow(Sheet sheet, CellStyle headerStyle) {
        Row header = sheet.createRow(0);
        String[] titles = {
                "Parent Name",
                "Student Name",
                "Budget Number",
                "Charge Amount"
        };

        for (int i = 0; i < titles.length; i++) {
            Cell cell = header.createCell(i);
            cell.setCellValue(titles[i]);
            cell.setCellStyle(headerStyle);
        }
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        return style;
    }

    private CellStyle createTotalStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        return style;
    }

    private String formatName(String firstName, String lastName) {
        return (firstName + " " + lastName).trim();
    }
}
