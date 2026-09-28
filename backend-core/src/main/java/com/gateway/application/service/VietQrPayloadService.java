package com.gateway.application.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Map;

@Service
public class VietQrPayloadService {
    private static final String GUID = "A000000727";
    private static final String SERVICE_CODE = "QRIBFTTA";

    public String generate(String bankBin, String accountNumber, long amount, String paymentCode) {
        String beneficiary = tlv("00", digits(bankBin, "bank BIN")) + tlv("01", alphaNumeric(accountNumber, 19, "account number"));
        String merchantAccount = tlv("00", GUID) + tlv("01", beneficiary) + tlv("02", SERVICE_CODE);
        String additional = tlv("08", alphaNumeric(paymentCode, 25, "payment code"));
        String withoutCrc = tlv("00", "01") + tlv("01", "12") + tlv("38", merchantAccount)
                + tlv("53", "704") + tlv("54", Long.toString(amount)) + tlv("58", "VN")
                + tlv("62", additional) + "6304";
        return withoutCrc + crc16(withoutCrc);
    }

    public String svg(String payload, int requestedSize) {
        int size = Math.max(180, Math.min(requestedSize, 1024));
        try {
            var matrix = new QRCodeWriter().encode(payload, BarcodeFormat.QR_CODE, size, size,
                    Map.of(EncodeHintType.CHARACTER_SET, StandardCharsets.UTF_8.name(),
                            EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M,
                            EncodeHintType.MARGIN, 2));
            StringBuilder path = new StringBuilder();
            for (int y = 0; y < matrix.getHeight(); y++) {
                for (int x = 0; x < matrix.getWidth(); x++) {
                    if (matrix.get(x, y)) path.append('M').append(x).append(',').append(y).append("h1v1h-1z");
                }
            }
            return "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 " + matrix.getWidth() + " "
                    + matrix.getHeight() + "\" shape-rendering=\"crispEdges\"><rect width=\"100%\" height=\"100%\" fill=\"white\"/><path d=\""
                    + path + "\" fill=\"#07111f\"/></svg>";
        } catch (Exception exception) {
            throw new IllegalStateException("Could not render VietQR", exception);
        }
    }

    public boolean hasValidCrc(String payload) {
        if (payload == null || payload.length() < 8 || !payload.substring(payload.length() - 8, payload.length() - 4).equals("6304")) return false;
        return crc16(payload.substring(0, payload.length() - 4)).equalsIgnoreCase(payload.substring(payload.length() - 4));
    }

    private String tlv(String id, String value) {
        int length = value.getBytes(StandardCharsets.UTF_8).length;
        if (length > 99) throw new IllegalArgumentException("VietQR field is too long");
        return id + String.format("%02d", length) + value;
    }

    private String digits(String value, String field) {
        if (value == null || !value.matches("\\d{6}")) throw new IllegalArgumentException("Invalid " + field);
        return value;
    }

    private String alphaNumeric(String value, int max, String field) {
        if (value == null) throw new IllegalArgumentException("Missing " + field);
        String normalized = value.trim().toUpperCase().replaceAll("[^A-Z0-9]", "");
        if (normalized.isBlank() || normalized.length() > max) throw new IllegalArgumentException("Invalid " + field);
        return normalized;
    }

    private String crc16(String value) {
        int crc = 0xFFFF;
        for (byte item : value.getBytes(StandardCharsets.UTF_8)) {
            crc ^= (item & 0xFF) << 8;
            for (int bit = 0; bit < 8; bit++) crc = (crc & 0x8000) != 0 ? (crc << 1) ^ 0x1021 : crc << 1;
            crc &= 0xFFFF;
        }
        return String.format("%04X", crc);
    }
}
