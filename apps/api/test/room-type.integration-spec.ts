/**
 * RoomTypeModule — integration tests against real Postgres.
 *
 * Verifies CRUD lifecycle and inventory-count behavior.
 */
import { PrismaService } from "../src/prisma/prisma.service";
import { RoomTypeService } from "../src/room-types/room-type.service";
import { getPrisma, truncateAll } from "./db";

describe("RoomTypeModule (integration)", () => {
  const prisma = getPrisma() as unknown as PrismaService;
  const svc = new RoomTypeService(prisma);

  beforeEach(async () => {
    await truncateAll(prisma as any);
  });

  afterAll(async () => {
    await (prisma as any).$disconnect();
  });

  it("creates a room type with required fields", async () => {
    const rt = await svc.create({
      name: "Deluxe",
      description: "Sea view",
      maxOccupancy: 2,
      totalUnits: 5,
      imageUrls: ["https://example.com/1.jpg"],
    });
    expect(rt.id).toBeDefined();
    expect(rt.name).toBe("Deluxe");
    expect(rt.totalUnits).toBe(5);
    expect(rt.imageUrls).toEqual(["https://example.com/1.jpg"]);
  });

  it("create defaults description to empty string and imageUrls to []", async () => {
    const rt = await svc.create({
      name: "Standard",
      maxOccupancy: 2,
      totalUnits: 3,
    });
    expect(rt.description).toBe("");
    expect(rt.imageUrls).toEqual([]);
  });

  it("list returns rooms in creation order", async () => {
    await svc.create({ name: "A", maxOccupancy: 2, totalUnits: 1 });
    await new Promise((r) => setTimeout(r, 5));
    await svc.create({ name: "B", maxOccupancy: 2, totalUnits: 1 });
    await new Promise((r) => setTimeout(r, 5));
    await svc.create({ name: "C", maxOccupancy: 2, totalUnits: 1 });
    const all = await svc.list();
    expect(all.map((r) => r.name)).toEqual(["A", "B", "C"]);
  });

  it("get throws NotFoundException for unknown id", async () => {
    await expect(svc.get("non-existent")).rejects.toThrow(/not found/i);
  });

  it("update changes only the provided fields", async () => {
    const rt = await svc.create({
      name: "Old",
      description: "old desc",
      maxOccupancy: 2,
      totalUnits: 5,
    });
    const updated = await svc.update(rt.id, { name: "New", totalUnits: 10 });
    expect(updated.name).toBe("New");
    expect(updated.totalUnits).toBe(10);
    expect(updated.description).toBe("old desc");
    expect(updated.maxOccupancy).toBe(2);
  });

  it("update on unknown id throws", async () => {
    await expect(svc.update("nope", { name: "x" })).rejects.toThrow();
  });

  it("remove deletes the room and cascades to its rates", async () => {
    const rt = await svc.create({
      name: "Temp",
      maxOccupancy: 2,
      totalUnits: 1,
    });
    await prisma.roomRate.create({
      data: { roomTypeId: rt.id, date: new Date("2026-05-01"), price: 1000 },
    });
    await svc.remove(rt.id);

    const found = await prisma.roomType.findUnique({ where: { id: rt.id } });
    expect(found).toBeNull();
    const rates = await prisma.roomRate.findMany({
      where: { roomTypeId: rt.id },
    });
    expect(rates).toHaveLength(0);
  });

  it("inventory count is enforced as integer (totalUnits stored as Int)", async () => {
    const rt = await svc.create({
      name: "Inv",
      maxOccupancy: 4,
      totalUnits: 7,
    });
    expect(Number.isInteger(rt.totalUnits)).toBe(true);
    expect(rt.totalUnits).toBe(7);
  });
});
