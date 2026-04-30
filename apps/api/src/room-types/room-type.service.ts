import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class RoomTypeService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.roomType.findMany({ orderBy: { createdAt: "asc" } });
  }

  async get(id: string) {
    const rt = await this.prisma.roomType.findUnique({ where: { id } });
    if (!rt) throw new NotFoundException("Room type not found");
    return rt;
  }

  create(data: {
    name: string;
    description?: string;
    maxOccupancy: number;
    totalUnits: number;
    imageUrls?: string[];
  }) {
    return this.prisma.roomType.create({
      data: {
        name: data.name,
        description: data.description ?? "",
        maxOccupancy: data.maxOccupancy,
        totalUnits: data.totalUnits,
        imageUrls: data.imageUrls ?? [],
      },
    });
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      maxOccupancy: number;
      totalUnits: number;
      imageUrls: string[];
    }>,
  ) {
    await this.get(id);
    return this.prisma.roomType.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.roomType.delete({ where: { id } });
    return { ok: true };
  }
}
