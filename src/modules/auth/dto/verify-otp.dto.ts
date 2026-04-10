import { IsNotEmpty, IsOptional, IsString, Length, MaxLength, MinLength } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(20)
  mobile_number: string;

  @IsString()
  @IsNotEmpty()
  @Length(4, 8)
  otp: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  device_id: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  guest_session_id?: string;
}
