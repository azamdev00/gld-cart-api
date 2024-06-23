import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  @Expose()
  accessToken: string;

  refreshToken: string;

  @ApiProperty({ example: { _id: 1, email: 'example@example.com' } })
  @Expose()
  user: {
    _id: string;
    email: string;
  };
}