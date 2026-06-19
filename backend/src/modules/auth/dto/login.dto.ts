import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user@timeline.local' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string;

  @ApiProperty({ example: 'User@123' })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu là bắt buộc' })
  password!: string;
}
