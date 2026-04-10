import { IsString, IsOptional } from 'class-validator';

export class SignupDto {
  @IsString()
  mobile_number!: string;

  @Require()
  @IsString()
  name?: string;
}
