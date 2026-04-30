import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { json, raw, static as expressStatic } from "express";
import { join } from "path";
import { mkdirSync } from "fs";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Ensure upload dirs exist + serve them statically
  const uploadsDir = join(process.cwd(), "uploads");
  mkdirSync(join(uploadsDir, "rooms"), { recursive: true });
  mkdirSync(join(uploadsDir, "slips"), { recursive: true });
  app.use("/uploads", expressStatic(uploadsDir));

  // Stripe webhook needs raw body — register raw parser only on that path
  app.use("/webhooks/stripe", raw({ type: "application/json" }));
  app.use(json());

  app.enableCors({
    origin: (origin, cb) => cb(null, true),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.setGlobalPrefix("api", {
    exclude: ["webhooks/stripe", "health"],
  });

  const port = process.env.API_PORT ? Number(process.env.API_PORT) : 4000;
  await app.listen(port);
  console.log(`API listening on http://localhost:${port}`);
}

bootstrap();
