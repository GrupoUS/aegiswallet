import { describe, expect, it } from "vitest";
import {
  formatCEP,
  formatCNPJ,
  formatCompactCurrency,
  formatCPF,
  formatCurrency,
  formatCurrencyForVoice,
  formatDate,
  formatDateForVoice,
  formatDuration,
  formatNumber,
  formatPercentage,
  formatPhone,
  getRelativeDays,
  isValidCNPJ,
  isValidCPF,
  ordinal,
  pluralize,
} from "@/lib/formatters/brazilianFormatters";

describe("Brazilian Formatters", () => {
  describe("Currency Formatting", () => {
    it("should format currency with R$ symbol", () => {
      expect(formatCurrency(1234.56)).toBe("R$ 1.234,56");
      expect(formatCurrency(0.99)).toBe("R$ 0,99");
      expect(formatCurrency(1000000)).toBe("R$ 1.000.000,00");
    });

    it("should format currency without symbol", () => {
      expect(formatCurrency(1234.56, { showSymbol: false })).toBe("1.234,56");
      expect(formatCurrency(0.99, { showSymbol: false })).toBe("0,99");
      expect(formatCurrency(1000000, { showSymbol: false })).toBe("1.000.000,00");
    });

    it("should format compact currency", () => {
      expect(formatCompactCurrency(1500)).toBe("R$ 1.5K");
      expect(formatCompactCurrency(1500000)).toBe("R$ 1.5M");
      expect(formatCompactCurrency(1500000000)).toBe("R$ 1.5B");
    });

    it("should format currency for voice", () => {
      expect(formatCurrencyForVoice(100)).toBe("cem reais");
      expect(formatCurrencyForVoice(1)).toBe("um real");
      expect(formatCurrencyForVoice(0.5)).toBe("50 centavos");
      expect(formatCurrencyForVoice(0.01)).toBe("1 centavo");
      expect(formatCurrencyForVoice(100.5)).toBe("cem reais e 50 centavos");
    });

    it("should handle negative amounts", () => {
      expect(formatCurrency(-100)).toContain("100");
      expect(formatCompactCurrency(-1500)).toBe("-R$ 1.5K");
      expect(formatCurrencyForVoice(-50)).toBe("menos cinquenta reais");
    });
  });

  describe("Date Formatting", () => {
    it("should format date as DD/MM/YYYY", () => {
      const date = new Date("2024-01-14");
      expect(formatDate(date)).toMatch(/14\/01\/2024/);
    });

    it("should show relative dates", () => {
      const today = new Date();
      expect(formatDate(today, { relative: true })).toBe("hoje");

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(formatDate(tomorrow, { relative: true })).toBe("amanhã");

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(formatDate(yesterday, { relative: true })).toBe("ontem");
    });

    it("should format date for voice", () => {
      const today = new Date();
      expect(formatDateForVoice(today)).toBe("hoje");

      const futureDate = new Date("2024-12-25");
      expect(formatDateForVoice(futureDate)).toContain("dezembro");
    });

    it("should get relative days correctly", () => {
      const today = new Date();
      expect(getRelativeDays(today)).toBe("hoje");

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(getRelativeDays(tomorrow)).toBe("amanhã");
    });
  });

  describe("Number Formatting", () => {
    it("should format numbers with Brazilian thousands separator", () => {
      expect(formatNumber(1234)).toBe("1.234");
      expect(formatNumber(1234567)).toBe("1.234.567");
    });

    it("should format numbers with decimals", () => {
      expect(formatNumber(1234.56, { decimals: 2 })).toBe("1.234,56");
    });

    it("should format percentages", () => {
      expect(formatPercentage(85.5)).toBe("85,5%");
      expect(formatPercentage(100, 0)).toBe("100%");
    });
  });

  describe("Document Formatting", () => {
    it("should format CPF correctly", () => {
      expect(formatCPF("12345678900")).toBe("123.456.789-00");
      expect(formatCPF("123456.789-00")).toBe("123.456.789-00");
    });

    it("should format CNPJ correctly", () => {
      expect(formatCNPJ("12345678000190")).toBe("12.345.678/0001-90");
      expect(formatCNPJ("12345678000190")).toBe("12.345.678/0001-90");
    });

    it("should format CEP correctly", () => {
      expect(formatCEP("01310100")).toBe("01310-100");
      expect(formatCEP("01310-100")).toBe("01310-100");
    });

    it("should format phone numbers", () => {
      expect(formatPhone("11987654321")).toBe("(11) 98765-4321");
      expect(formatPhone("1133334444")).toBe("(11) 3333-4444");
    });

    it("should validate CPF", () => {
      expect(isValidCPF("11111111111")).toBe(false); // All same digits
      expect(isValidCPF("123.456.789-00")).toBe(false); // Invalid checksum
      // Add valid CPF test if needed
    });

    it("should validate CNPJ", () => {
      expect(isValidCNPJ("00000000000000")).toBe(false);
      // Add valid CNPJ test if needed
    });
  });

  describe("Utility Functions", () => {
    it("should pluralize words correctly", () => {
      expect(pluralize(1, "item")).toBe("item");
      expect(pluralize(2, "item")).toBe("items");
      expect(pluralize(0, "item")).toBe("items");
    });

    it("should format duration", () => {
      expect(formatDuration(1000)).toBe("1 segundo");
      expect(formatDuration(60000)).toBe("1 minuto");
      expect(formatDuration(3600000)).toBe("1 hora");
      expect(formatDuration(86400000)).toBe("1 dia");
    });

    it("should format ordinal numbers", () => {
      expect(ordinal(1)).toBe("1º");
      expect(ordinal(2)).toBe("2º");
      expect(ordinal(1, "feminine")).toBe("1ª");
      expect(ordinal(2, "feminine")).toBe("2ª");
    });
  });
});
