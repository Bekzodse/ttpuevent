package uz.university.uems.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;
import uz.university.uems.entity.HallApplication;
import uz.university.uems.exception.BadRequestException;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Service
public class BookingPdfService {

    private static final DateTimeFormatter TS_FMT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm").withZone(ZoneId.systemDefault());

    public byte[] generateConfirmationPdf(HallApplication app) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4, 42, 42, 48, 48);
            PdfWriter.getInstance(doc, out);
            doc.open();

            Color brandColor = new Color(29, 59, 139);
            Color darkText = new Color(15, 23, 42);
            Color mutedText = new Color(100, 116, 139);
            Color lightBg = new Color(248, 250, 252);
            Color emeraldBg = new Color(236, 253, 245);
            Color emeraldText = new Color(4, 120, 87);

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Color.WHITE);
            Font subTitleFont = FontFactory.getFont(FontFactory.HELVETICA, 10, new Color(224, 231, 255));
            Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, brandColor);
            Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, mutedText);
            Font valueFont = FontFactory.getFont(FontFactory.HELVETICA, 10, darkText);
            Font badgeFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, emeraldText);
            Font footerFont = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9, mutedText);

            // Header Banner
            PdfPTable header = new PdfPTable(1);
            header.setWidthPercentage(100);
            PdfPCell headerCell = new PdfPCell();
            headerCell.setBackgroundColor(brandColor);
            headerCell.setBorder(Rectangle.NO_BORDER);
            headerCell.setPadding(18);

            Paragraph p1 = new Paragraph("TURIN POLYTECHNIC UNIVERSITY IN TASHKENT", subTitleFont);
            Paragraph p2 = new Paragraph("OFFICIAL EVENT HALL BOOKING CONFIRMATION", titleFont);
            p2.setSpacingBefore(4);
            headerCell.addElement(p1);
            headerCell.addElement(p2);
            header.addCell(headerCell);
            doc.add(header);

            // Status Banner
            PdfPTable statusBox = new PdfPTable(2);
            statusBox.setWidthPercentage(100);
            statusBox.setSpacingBefore(14);
            statusBox.setWidths(new float[]{1.2f, 1f});

            PdfPCell leftStatus = new PdfPCell(new Phrase("STATUS: BOOKING CONFIRMED", badgeFont));
            leftStatus.setBackgroundColor(emeraldBg);
            leftStatus.setBorderColor(new Color(167, 243, 208));
            leftStatus.setPadding(10);

            PdfPCell rightCode = new PdfPCell(new Phrase("Application ID: " + app.getApplicationCode(), labelFont));
            rightCode.setBackgroundColor(emeraldBg);
            rightCode.setHorizontalAlignment(Element.ALIGN_RIGHT);
            rightCode.setBorderColor(new Color(167, 243, 208));
            rightCode.setPadding(10);

            statusBox.addCell(leftStatus);
            statusBox.addCell(rightCode);
            doc.add(statusBox);

            // Event & Hall Details
            addSectionTitle(doc, "Event & Hall Reservation Details", sectionFont);
            PdfPTable eventTable = createInfoTable();
            addRow(eventTable, "Event Name", app.getEventName(), labelFont, valueFont, lightBg);
            addRow(eventTable, "Event Type", app.getEventType(), labelFont, valueFont, Color.WHITE);
            addRow(eventTable, "Reserved Hall", app.getHall().getName(), labelFont, valueFont, lightBg);
            addRow(eventTable, "Location", app.getHall().getBuilding() + " (" + app.getHall().getFloor() + ")", labelFont, valueFont, Color.WHITE);
            addRow(eventTable, "Event Date", app.getEventDate().toString(), labelFont, valueFont, lightBg);
            addRow(eventTable, "Time Slot", app.getStartTime() + " - " + app.getEndTime(), labelFont, valueFont, Color.WHITE);
            addRow(eventTable, "Expected Participants", String.valueOf(app.getExpectedParticipants()), labelFont, valueFont, lightBg);
            if (app.getDescription() != null && !app.getDescription().isBlank()) {
                addRow(eventTable, "Description / Notes", app.getDescription(), labelFont, valueFont, Color.WHITE);
            }
            doc.add(eventTable);

            // Applicant Details
            addSectionTitle(doc, "Applicant Information", sectionFont);
            PdfPTable userTable = createInfoTable();
            addRow(userTable, "Full Name", app.getApplicantFirstName() + " " + app.getApplicantLastName(), labelFont, valueFont, lightBg);
            addRow(userTable, "Phone Number", app.getApplicantPhoneNumber(), labelFont, valueFont, Color.WHITE);
            addRow(userTable, "Portal Username", "@" + app.getApplicant().getUsername(), labelFont, valueFont, lightBg);
            doc.add(userTable);

            // Payment Verification Details
            addSectionTitle(doc, "Payment & Verification Summary", sectionFont);
            PdfPTable payTable = createInfoTable();
            addRow(payTable, "Payment Status", String.valueOf(app.getPaymentStatus()), labelFont, valueFont, lightBg);
            addRow(payTable, "Paid Amount", "$" + app.getRequiredAmount(), labelFont, valueFont, Color.WHITE);
            addRow(payTable, "University Bank", app.getBankName(), labelFont, valueFont, lightBg);
            addRow(payTable, "Treasury Card", app.getBankCardNumber(), labelFont, valueFont, Color.WHITE);
            addRow(payTable, "Verified By Admin", app.getVerifiedByAdmin() != null ? app.getVerifiedByAdmin() : "University Admin", labelFont, valueFont, lightBg);
            addRow(payTable, "Confirmed On", app.getConfirmedAt() != null ? TS_FMT.format(app.getConfirmedAt()) : "Confirmed", labelFont, valueFont, Color.WHITE);
            doc.add(payTable);

            Paragraph footer = new Paragraph(
                    "Generated electronically by UniPortal University Management System. "
                            + "Please present this confirmation certificate (Application ID: "
                            + app.getApplicationCode() + ") at the hall reception desk on the event date.",
                    footerFont);
            footer.setSpacingBefore(24);
            doc.add(footer);

            doc.close();
            return out.toByteArray();
        } catch (Exception ex) {
            throw new BadRequestException("Could not generate booking confirmation PDF: " + ex.getMessage());
        }
    }

    private void addSectionTitle(Document doc, String text, Font font) throws DocumentException {
        Paragraph p = new Paragraph(text, font);
        p.setSpacingBefore(16);
        p.setSpacingAfter(6);
        doc.add(p);
    }

    private PdfPTable createInfoTable() throws DocumentException {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{1.1f, 2.2f});
        return table;
    }

    private void addRow(PdfPTable table, String label, String value, Font labelFont, Font valueFont, Color bg) {
        PdfPCell c1 = new PdfPCell(new Phrase(label, labelFont));
        c1.setBackgroundColor(bg);
        c1.setBorderColor(new Color(226, 232, 240));
        c1.setPadding(8);

        PdfPCell c2 = new PdfPCell(new Phrase(value != null ? value : "-", valueFont));
        c2.setBackgroundColor(bg);
        c2.setBorderColor(new Color(226, 232, 240));
        c2.setPadding(8);

        table.addCell(c1);
        table.addCell(c2);
    }
}
