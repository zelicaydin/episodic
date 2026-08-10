import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { SeasonGrid } from "@episodic/shared";
import { RatingGrid } from "../src/components/RatingGrid";

const seasons: SeasonGrid[] = [
  { season: 1, average: 8.7, episodes: [
    { tconst: "tt11", season: 1, episode: 1, title: "Pilot", rating: 9.1, votes: 5000, watched: false },
    { tconst: "tt12", season: 1, episode: 2, title: "Second", rating: null, votes: 0, watched: true },
  ] },
];

describe("RatingGrid", () => {
  it("renders ratings, gray unrated cells, season average", () => {
    render(<RatingGrid seasons={seasons} showSeasonAvg watchMode={false} onToggleWatched={() => {}} />);
    expect(screen.getByText("9.1")).toBeDefined();
    expect(screen.getByText("8.7")).toBeDefined();
    expect(screen.getByTitle(/S1E1 Pilot/)).toBeDefined();
  });
  it("watch mode clicks call onToggleWatched", () => {
    const spy = vi.fn();
    render(<RatingGrid seasons={seasons} showSeasonAvg={false} watchMode onToggleWatched={spy} />);
    fireEvent.click(screen.getByText("9.1"));
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ tconst: "tt11" }));
  });
});
