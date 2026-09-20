import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class WithdrawDto {
  @ApiProperty({
    description: 'Amount to withdraw (must be positive)',
    example: 50.00,
  })
  @IsNumber()
  @IsPositive()
  amount: number;
}
