import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname, join } from "path";
import { randomBytes } from "crypto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { SuperAdminGuard } from "../auth/super-admin.guard";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024;

function diskFor(subdir: "rooms" | "slips") {
  return diskStorage({
    destination: join(process.cwd(), "uploads", subdir),
    filename: (_req, file, cb) => {
      const id = randomBytes(8).toString("hex");
      cb(null, `${Date.now()}-${id}${extname(file.originalname)}`);
    },
  });
}

const PUBLIC_URL =
  process.env.API_PUBLIC_URL ??
  process.env.API_URL ??
  "http://localhost:4000";

@Controller("uploads")
export class UploadsController {
  /** Admin-only: upload a room photo (SUPER_ADMIN; STAFF cannot manage rooms) */
  @UseGuards(JwtAuthGuard, RolesGuard, SuperAdminGuard)
  @Roles("ADMIN")
  @Post("rooms")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskFor("rooms"),
      limits: { fileSize: MAX_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED.includes(file.mimetype))
          return cb(new BadRequestException("Unsupported image type"), false);
        cb(null, true);
      },
    }),
  )
  uploadRoom(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException("No file uploaded");
    return { url: `${PUBLIC_URL}/uploads/rooms/${file.filename}` };
  }

  /** Public: guest uploads payment slip */
  @Post("slips")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskFor("slips"),
      limits: { fileSize: MAX_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED.includes(file.mimetype))
          return cb(new BadRequestException("Unsupported image type"), false);
        cb(null, true);
      },
    }),
  )
  uploadSlip(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException("No file uploaded");
    return { url: `${PUBLIC_URL}/uploads/slips/${file.filename}` };
  }
}
