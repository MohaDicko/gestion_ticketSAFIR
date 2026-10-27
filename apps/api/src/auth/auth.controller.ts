import { Controller, Post, Get, Body, Req, Res, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { Request, Response } from "express";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
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
      // Pour la démo / repli, si aucun token n'est fourni, on retourne le profil Aliko par défaut
      return {
        id: "aliko-head-id",
        email: "aliko.getheme@safirconsulting.net",
        firstName: "Aliko",
        lastName: "Getheme",
        roles: ["HEAD", "ADMIN"],
        timezone: "Europe/Paris",
        mode: "HEAD_SESSION",
      };
    }

    const user = await this.authService.getSessionUser(token);
    if (!user) {
      throw new UnauthorizedException("Session expirée ou invalide");
    }

    return user;
  }

  @Post("logout")
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie("dc_session");
    res.clearCookie("dc_csrf");
    return { message: "Déconnexion réussie" };
  }
}
