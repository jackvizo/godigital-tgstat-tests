import Big from "big.js";

export function generateTimeIntervals(inputNumber: number, intervalCount: number): Array<[number, number]> {
  if (intervalCount < 2) {
    throw new Error("Количество интервалов должно быть >= 2");
  }

  const intervals: Array<[number, number]> = [];
  const totalLength = new Big(inputNumber).times(intervalCount);
  const baseLength = totalLength.div(intervalCount);

  let startTime = new Big(0);

  for (let i = 0; i < intervalCount; i++) {
    const endTime = startTime.plus(baseLength);
    intervals.push([parseFloat(startTime.toString()), parseFloat(endTime.toString())]);
    startTime = endTime;
  }

  return intervals;
}

export function checkIntervals(inputNumber: number, intervals: Array<[number, number]>): boolean {
  const totalLength = intervals.reduce((sum, [start, end]) => sum.plus(new Big(end).minus(start)), new Big(0));
  const averageLength = totalLength.div(intervals.length);
  return parseFloat(averageLength.toString()) === inputNumber;
}
