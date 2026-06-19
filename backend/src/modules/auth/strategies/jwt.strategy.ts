import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

interface JwtPayload {
  sub: string;
  email: string;
  role: 'User' | 'Admin';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret') ?? 'dev-secret-please-change',
    });
  }

  // Giá trị trả về được gắn vào request.user
  validate(payload: JwtPayload): CurrentUserPayload {
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
