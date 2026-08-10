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
  if (era && era.to === last && era.from > 1) {
    return pick(tconst, [
      `A late bloomer: it finds its stride in ${eraStr}.`,
      `Stick with it, the best stretch is ${eraStr}.`,
      `Slow start, strong finish: the payoff lives in ${eraStr}.`,
    ]);
  }
  if (era && era.to < last) {
    return pick(tconst, [
      `Peaks early: the golden era is ${eraStr}, then it coasts.`,
      `Best years up front (${eraStr}); temper expectations after.`,
      `The magic is front-loaded in ${eraStr}.`,
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
