import { generateTimeIntervals, checkIntervals } from "./seed-intervals";

describe("generateTimeIntervals", () => {
  it("should return intervals with an average length equal to the input number", () => {
    const inputNumber = 5.5;
    const intervalCount = 3;
    const intervals = generateTimeIntervals(inputNumber, intervalCount);

    const isValid = checkIntervals(inputNumber, intervals);
    expect(isValid).toBe(true);
  });

  it("should handle integer input correctly", () => {
    const inputNumber = 4;
    const intervalCount = 4;
    const intervals = generateTimeIntervals(inputNumber, intervalCount);

    const isValid = checkIntervals(inputNumber, intervals);
    expect(isValid).toBe(true);
  });

  it("should throw an error if interval count is less than 2", () => {
    expect(() => generateTimeIntervals(5.5, 1)).toThrow("Количество интервалов должно быть >= 2");
  });

  it("should handle small fractional input correctly", () => {
    const inputNumber = 0.1;
    const intervalCount = 5;
    const intervals = generateTimeIntervals(inputNumber, intervalCount);

    const isValid = checkIntervals(inputNumber, intervals);
    expect(isValid).toBe(true);
  });

  it("should work correctly for interval count of 1000", () => {
    const inputNumber = 5.1;
    const intervalCount = 1000;
    const intervals = generateTimeIntervals(inputNumber, intervalCount);

    const isValid = checkIntervals(inputNumber, intervals);
    expect(isValid).toBe(true);
  });

  it("should handle large numbers correctly", () => {
    const inputNumber = 1000000.123;
    const intervalCount = 100;
    const intervals = generateTimeIntervals(inputNumber, intervalCount);

    const isValid = checkIntervals(inputNumber, intervals);
    expect(isValid).toBe(true);
  });

  it("should handle very small fractional input correctly", () => {
    const inputNumber = 0.0001;
    const intervalCount = 1000;
    const intervals = generateTimeIntervals(inputNumber, intervalCount);

    const isValid = checkIntervals(inputNumber, intervals);
    expect(isValid).toBe(true);
  });
});
