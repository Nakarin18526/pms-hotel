import { Body, Controller, Get, Post, UseGuards, Req } from "@nestjs/common";
import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";

class RegisterDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
  @IsOptional() @IsString() name?: string;
  @IsString() phone!: string;
}

class LoginDto {
  @IsEmail() email!: string;
  @IsString() password!: string;
}

class GoogleLoginDto {
  @IsEmail() email!: string;
  @IsOptional() @IsString() name?: string;
  @IsString() idToken!: string; // verified upstream by NextAuth
}

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("guest/register")
  register(@Body() dto: RegisterDto) {
    return this.auth.registerGuest(dto.email, dto.password, dto.name, dto.phone);
  }

  @Post("guest/login")
  login(@Body() dto: LoginDto) {
    return this.auth.loginGuest(dto.email, dto.password);
  }

  @Post("guest/google")
  google(@Body() dto: GoogleLoginDto) {
    return this.auth.loginOrCreateGoogleGuest(dto.email, dto.name);
  }

  @Post("admin/login")
  adminLogin(@Body() dto: LoginDto) {
    return this.auth.loginAdmin(dto.email, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@Req() req: any) {
    return this.auth.me(req.user);
  }
}
