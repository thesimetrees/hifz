import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProgramOrderDto {
  @IsString()
  @Length(1, 100)
  programId!: string;
}

export class SubmitProofDto {
  @IsString()
  @Length(3, 100)
  senderName!: string;

  @IsOptional()
  @IsString()
  @Length(2, 60)
  senderBank?: string;
}

export class RejectOrderDto {
  @IsString()
  @Length(5, 500)
  reason!: string;
}

export class AdminListOrdersDto {
  @IsOptional()
  @IsIn([
    'PENDING_PAYMENT',
    'WAITING_CONFIRMATION',
    'PROCESSING',
    'CONFIRMED',
    'REJECTED',
    'EXPIRED',
    'CANCELLED',
  ])
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
