import { IsString, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CalculateShippingDto {
  @IsString()
  md!: string;

  @Type(() => Number)
  @IsNumber()
  cgm!: number;

  @Type(() => Number)
  @IsNumber()
  o_pin!: number;

  @Type(() => Number)
  @IsNumber()
  d_pin!: number;

  @IsString()
  ss!: string;

  @IsString()
  pt!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  l?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  b?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  h?: number;
}
