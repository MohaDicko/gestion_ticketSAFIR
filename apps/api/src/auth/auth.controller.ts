import { Controller, Post, Get, Body, Req, Res, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { Request, Response } from "express";
import { Public } from "./public.decorator";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @Public()
  async login(
    @Body() body: { email?: string; password?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!body.email || !body.password) {
      throw new UnauthorizedException("E-mail et mot de passe requis");
    }

    const { sessionToken, csrfSecret, user } = await this.authService.validateUser(body.email, body.password);

    res.cookie("dc_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 3600 * 1000,
    });

    res.cookie("dc_csrf", csrfSecret, {
      httpOnly: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 3600 * 1000,
    });

    return {
      message: "Connexion réussie",
      user,
      csrfToken: csrfSecret,
    };
  }

  @Get("me")
  async me(@Req() req: Request) {
    const token = req.cookies?.dc_session || req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      throw new UnauthorizedException("Authentification requise");
    }

    const user = await this.authService.getSessionUser(token);
    if (!user) {
      throw new UnauthorizedException("Session expirée ou invalide");
    }

    return user;
  }

  @Post("change-password")
  async changePassword(
    @Req() req: Request & { user?: { id: string } },
    @Body() body: { currentPassword?: string; newPassword?: string },
  ) {
    if (!req.user?.id) {
      throw new UnauthorizedException("Authentification requise");
    }

    return this.authService.changePassword(
      req.user.id,
      body.currentPassword || "",
      body.newPassword || "",
    );
  }

  @Post("logout")
  @Public()
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie("dc_session");
    res.clearCookie("dc_csrf");
    return { message: "Déconnexion réussie" };
  }
}
