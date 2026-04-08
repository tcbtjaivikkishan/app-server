import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  mobile_number!: string;

  @IsString()
  @Matches(/^\d{4,6}$/, {
    message: 'Invalid OTP',
  })
  otp!: string;
}
