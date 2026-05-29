package com.nextlevel.api.util;

public class SanitizationUtils {
    
    public static String sanitizeText(String input) {
        if (input == null) return null;
        // Basic sanitization of script tags for raw markdown/text inputs
        return input.replaceAll("(?i)<script.*?>.*?</script.*?>", "")
                    .replaceAll("(?i)<.*?javascript:.*?>", "")
                    .replaceAll("(?i)onload=.*?>", ">")
                    .replaceAll("(?i)onerror=.*?>", ">");
    }
}
