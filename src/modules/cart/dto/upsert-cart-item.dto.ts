import { IsMongoId, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class UpsertCartItemDto {
  @IsMongoId()
  @IsNotEmpty()
  product_id: string;

  @IsNumber()
  @Min(0)
  quantity: number; // 0 => remove
}

