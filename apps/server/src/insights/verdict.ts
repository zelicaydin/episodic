import type { Insights } from "@episodic/shared";

type Signals = Omit<Insights, "verdict">;

function pick(tconst: string, variants: string[]): string {
  let h = 0;
  for (const ch of tconst) h += ch.charCodeAt(0);
  return variants[h % variants.length] as string;
}

export function pickVerdict(i: Signals, tconst: string): string {
  const avgs = i.seasonAverages.map((s) => s.average).filter((a): a is number => a !== null);
  const last = i.seasonAverages.at(-1)?.season ?? 0;
  const era = i.goldenEra;
  const eraStr = era ? (era.from === era.to ? `S${era.from}` : `S${era.from} to S${era.to}`) : "";

  const defined = (xs: (number | null)[]) => xs.filter((a): a is number => a !== null);
  const mean = (xs: number[]) => (xs.length === 0 ? null : xs.reduce((a, b) => a + b, 0) / xs.length);
  const inEra = era ? defined(i.seasonAverages.filter((s) => s.season >= era.from && s.season <= era.to).map((s) => s.average)) : [];
  const afterEra = era ? defined(i.seasonAverages.filter((s) => s.season > era.to).map((s) => s.average)) : [];
  const beforeEra = era ? defined(i.seasonAverages.filter((s) => s.season < era.from).map((s) => s.average)) : [];
  const eraMean = mean(inEra);
  const afterMean = mean(afterEra);
  const beforeMean = mean(beforeEra);
  // a decline only counts as a real drop-off at half a point or more
  const MEANINGFUL = 0.5;

  if (i.weightedAverage === null) {
    return pick(tconst, [
      "Not enough ratings yet to judge this one.",
      "The jury is still out: not enough ratings yet.",
    ]);
  }
  if (i.fallOffSeason !== null) {
    return pick(tconst, [
      `Great until it wasn't. Turn back before S${i.fallOffSeason}.`,
      `A strong run with a hard crash: S${i.fallOffSeason} is where it falls off.`,
      `The wheels come off in S${i.fallOffSeason}; everything before it still holds up.`,
    ]);
  }
  if (avgs.length >= 3 && avgs.every((a) => a >= 8.5)) {
    return pick(tconst, [
      "Elite from start to finish. No skippable seasons.",
      "Elite the whole way through, and it sticks the landing.",
      `Consistently excellent, and it peaks with S${i.peak?.season ?? last}.`,
    ]);
  }
  if (i.seasonAverages.length <= 2 && i.weightedAverage >= 8) {
    return pick(tconst, [
      "Short and sweet: it says what it came to say and leaves.",
      "A tight run with no filler. Watch all of it.",
      "In and out with zero filler. A clean binge.",
    ]);
  }
  if (era && era.to === last && era.from > 1
    && eraMean !== null && beforeMean !== null && eraMean - beforeMean >= MEANINGFUL) {
    return pick(tconst, [
      `A late bloomer: it finds its stride in ${eraStr}.`,
      `Stick with it, the best stretch is ${eraStr}.`,
      `Slow start, strong finish: the payoff lives in ${eraStr}.`,
    ]);
  }
  if (era && era.to < last
    && eraMean !== null && afterMean !== null && eraMean - afterMean >= MEANINGFUL) {
    return pick(tconst, [
      `Peaks early: the golden era is ${eraStr}, then it coasts.`,
      `Best years up front (${eraStr}); temper expectations after.`,
      `The magic is front-loaded in ${eraStr}.`,
    ]);
  }
  if (avgs.length >= 3 && Math.max(...avgs) - Math.min(...avgs) < 0.6) {
    return pick(tconst, [
      "Remarkably even: every season lands in the same range.",
      "Steady throughout, with no weak stretch to skip.",
      `No surprises in either direction: it holds around ${i.weightedAverage.toFixed(1)} the whole way.`,
    ]);
  }
  if (avgs.length >= 2 && Math.max(...avgs) - Math.min(...avgs) >= 1.2) {
    return pick(tconst, [
      "A rollercoaster: brilliant one season, baffling the next.",
      `Wildly uneven, but S${i.peak?.season ?? "?"} makes it worth the ride.`,
      "Highs and lows with little in between. Pick your seasons.",
    ]);
  }
  if (i.weightedAverage >= 7.5) {
    return pick(tconst, [
      "Reliably good without ever quite being great.",
      "A solid watch: steady quality, few surprises.",
    ]);
  }
  return pick(tconst, [
    "A rough ride by the numbers. Enter at your own risk.",
    "The ratings suggest patience will be required.",
  ]);
}
