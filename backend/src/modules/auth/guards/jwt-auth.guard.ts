import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Guard yêu cầu JWT hợp lệ (dùng @UseGuards(JwtAuthGuard) ở controller).
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
