/**
 * Pure functional spec for the overlap predicate.
 * Encodes the invariant from the PRD as readable cases.
 *
 *   overlaps(b, range) = b.checkIn < range.checkOut AND b.checkOut > range.checkIn
 */

function overlaps(
  b: { checkIn: string; checkOut: string },
  range: { checkIn: string; checkOut: string },
): boolean {
  return (
    new Date(b.checkIn) < new Date(range.checkOut) &&
    new Date(b.checkOut) > new Date(range.checkIn)
  );
}

describe("availability overlap predicate", () => {
  const range = { checkIn: "2026-05-10", checkOut: "2026-05-12" };

  it("returns false when booking ends before range starts", () => {
    expect(
      overlaps({ checkIn: "2026-05-05", checkOut: "2026-05-10" }, range),
    ).toBe(false); // back-to-back: ends exactly on checkIn
  });

  it("returns false when booking starts on range checkOut", () => {
    expect(
      overlaps({ checkIn: "2026-05-12", checkOut: "2026-05-15" }, range),
    ).toBe(false);
  });

  it("returns true when booking covers entire range", () => {
    expect(
      overlaps({ checkIn: "2026-05-01", checkOut: "2026-05-31" }, range),
    ).toBe(true);
  });

  it("returns true when booking partially overlaps start", () => {
    expect(
      overlaps({ checkIn: "2026-05-08", checkOut: "2026-05-11" }, range),
    ).toBe(true);
  });

  it("returns true when booking partially overlaps end", () => {
    expect(
      overlaps({ checkIn: "2026-05-11", checkOut: "2026-05-13" }, range),
    ).toBe(true);
  });

  it("returns true when booking is contained within range", () => {
    expect(
      overlaps({ checkIn: "2026-05-10", checkOut: "2026-05-11" }, range),
    ).toBe(true);
  });
});
