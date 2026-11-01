import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "@prisma/client";
import { Request } from "express";
import { ROLES_KEY } from "./roles.decorator";
import { AuthService } from "./auth.service";

type AuthenticatedRequest = Request & {
  user?: Awaited<ReturnType<AuthService["getSessionUser"]>>;
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userRoles = request.user?.roles ?? [];
    if (requiredRoles.some((role) => userRoles.includes(role))) return true;

    throw new ForbiddenException("Permissions insuffisantes pour cette opération");
  }
}
