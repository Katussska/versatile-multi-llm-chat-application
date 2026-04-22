import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import type { UserSession } from '@thallesp/nestjs-better-auth';

type AdminUser = UserSession['user'] & { admin?: boolean };

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { session?: UserSession }>();
    const session = request.session;

    if (!(session?.user as AdminUser | undefined)?.admin) {
      throw new ForbiddenException('Admin access required');
    }
    return true;
  }
}
