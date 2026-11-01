import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { AuthService } from "./auth.service";
import { IS_PUBLIC_KEY } from "./public.decorator";

type AuthenticatedRequest = Request & {
  user?: Awaited<ReturnType<AuthService["getSessionUser"]>>;
};

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.cookies?.dc_session || request.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) {
      throw new UnauthorizedException("Authentification requise");
    }

    const user = await this.authService.getSessionUser(token);
    if (!user) {
      throw new UnauthorizedException("Session expirée ou invalide");
    }

    request.user = user;

    const usesCookieSession = Boolean(request.cookies?.dc_session);
    const mutatingMethod = !["GET", "HEAD", "OPTIONS"].includes(request.method);
    if (usesCookieSession && mutatingMethod) {
      const csrfCookie = request.cookies?.dc_csrf;
      const csrfHeader = request.headers["x-csrf-token"];
      const csrfToken = Array.isArray(csrfHeader) ? csrfHeader[0] : csrfHeader;
      if (!csrfCookie || !csrfToken || csrfCookie !== csrfToken) {
        throw new ForbiddenException("Jeton CSRF manquant ou invalide");
      }
    }

    return true;
  }
}
