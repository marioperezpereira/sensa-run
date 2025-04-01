import { calculateIAAFPoints } from "../calculator";
import { timeToSeconds } from "@/lib/utils";

describe("calculateIAAFPoints", () => {
  // Test input validation
  describe("input validation", () => {
    it("should return 0 for invalid distance", () => {
      const result = calculateIAAFPoints("", 0, 0, 0);
      expect(result).toBe(0);
    });

    it("should return 0 for negative time components", () => {
      const result = calculateIAAFPoints("5K", -1, 0, 0);
      expect(result).toBe(0);
    });

    it("should return 0 for unknown distance", () => {
      const result = calculateIAAFPoints("UnknownDistance", 0, 0, 0);
      expect(result).toBe(0);
    });
  });

  // Test road races
  describe("road races", () => {
    it("should calculate points for 5K", () => {
      const result = calculateIAAFPoints("5K", 0, 20, 0);
      expect(result).toBeGreaterThan(0);
    });

    it("should calculate points for 10K", () => {
      const result = calculateIAAFPoints("10K", 0, 40, 0);
      expect(result).toBeGreaterThan(0);
    });

    it("should calculate points for Half Marathon", () => {
      const result = calculateIAAFPoints("Half Marathon", 1, 30, 0);
      expect(result).toBeGreaterThan(0);
    });

    it("should calculate points for Marathon", () => {
      const result = calculateIAAFPoints("Marathon", 3, 0, 0);
      expect(result).toBeGreaterThan(0);
    });
  });

  // Test track races (outdoor)
  describe("track races (outdoor)", () => {
    it("should calculate points for 100m", () => {
      const result = calculateIAAFPoints("100m", 0, 0, 10);
      expect(result).toBeGreaterThan(0);
    });

    it("should calculate points for 1500m", () => {
      const result = calculateIAAFPoints("1500m", 0, 4, 0);
      expect(result).toBeGreaterThan(0);
    });

    it("should calculate points for 5000m", () => {
      const result = calculateIAAFPoints("5000m", 0, 15, 0);
      expect(result).toBeGreaterThan(0);
    });
  });

  // Test track races (indoor)
  describe("track races (indoor)", () => {
    it("should calculate points for 60m", () => {
      const result = calculateIAAFPoints("60m", 0, 0, 7, "M", true);
      expect(result).toBeGreaterThan(0);
    });

    it("should calculate points for indoor 200m", () => {
      const result = calculateIAAFPoints("200m", 0, 0, 22, "M", true);
      expect(result).toBeGreaterThan(0);
    });

    it("should calculate points for indoor 1500m", () => {
      const result = calculateIAAFPoints("1500m", 0, 4, 0, "M", true);
      expect(result).toBeGreaterThan(0);
    });
  });

  // Test gender-specific calculations
  describe("gender-specific calculations", () => {
    it("should calculate different points for men and women in same event", () => {
      const menResult = calculateIAAFPoints("5K", 0, 20, 0, "M");
      const womenResult = calculateIAAFPoints("5K", 0, 20, 0, "F");
      expect(menResult).not.toBe(womenResult);
    });
  });

  // Test time conversion
  describe("time conversion", () => {
    it("should handle hours correctly", () => {
      const result = calculateIAAFPoints("Marathon", 2, 30, 0);
      expect(result).toBeGreaterThan(0);
    });

    it("should handle minutes correctly", () => {
      const result = calculateIAAFPoints("5K", 0, 25, 0);
      expect(result).toBeGreaterThan(0);
    });

    it("should handle seconds correctly", () => {
      const result = calculateIAAFPoints("100m", 0, 0, 10);
      expect(result).toBeGreaterThan(0);
    });
  });

  // Test error handling
  describe("error handling", () => {
    it("should handle missing coefficients gracefully", () => {
      const result = calculateIAAFPoints("5K", 0, 20, 0, "X" as any);
      expect(result).toBe(0);
    });

    it("should handle calculation errors gracefully", () => {
      // This test might need to be adjusted based on actual error cases
      const result = calculateIAAFPoints("5K", Infinity, 0, 0);
      expect(result).toBe(0);
    });
  });
}); 