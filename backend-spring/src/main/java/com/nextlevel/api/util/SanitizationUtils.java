package com.nextlevel.api.util;

import org.owasp.html.HtmlPolicyBuilder;
import org.owasp.html.PolicyFactory;

/**
 * Input sanitization utilities using OWASP Java HTML Sanitizer.
 * All user-provided text content should be sanitized before storage to prevent XSS attacks.
 */
public class SanitizationUtils {

    // Strict policy: strip ALL HTML tags. Allows only plain text.
    private static final PolicyFactory STRICT_POLICY = new HtmlPolicyBuilder().toFactory();

    // Lenient policy: allow basic formatting tags for rich-text fields.
    private static final PolicyFactory FORMATTING_POLICY = new HtmlPolicyBuilder()
            .allowElements("b", "i", "u", "em", "strong", "p", "br", "ul", "ol", "li", "code", "pre", "blockquote")
            .toFactory();

    /**
     * Sanitizes input by stripping ALL HTML tags. Safe for plain-text fields.
     */
    public static String sanitizeText(String input) {
        if (input == null) return null;
        return STRICT_POLICY.sanitize(input);
    }

    /**
     * Sanitizes input allowing basic formatting tags. Safe for rich-text/markdown fields.
     */
    public static String sanitizeRichText(String input) {
        if (input == null) return null;
        return FORMATTING_POLICY.sanitize(input);
    }
}
