import { SetMetadata } from "@nestjs/common";

export const ROLES_KEY = "roles";
export const Roles = (...roles: ("ADMIN" | "GUEST")[]) =>
  SetMetadata(ROLES_KEY, roles);
