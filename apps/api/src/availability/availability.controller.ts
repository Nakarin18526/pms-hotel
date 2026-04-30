import { Controller, Get, Query } from "@nestjs/common";
import { AvailabilityService } from "./availability.service";

@Controller("availability")
export class AvailabilityController {
  constructor(private readonly svc: AvailabilityService) {}

  @Get()
  search(
    @Query("checkIn") checkIn: string,
    @Query("checkOut") checkOut: string,
  ) {
    return this.svc.searchAll(checkIn, checkOut);
  }
}
