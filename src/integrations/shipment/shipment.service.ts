import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse, AxiosError } from 'axios';
import { Observable } from 'rxjs';

@Injectable()
export class ShipmentService {
  constructor(private readonly httpService: HttpService) { }

  async calculateShipping(dto: any): Promise<any> {
    try {
      const url = `/api/kinko/v1/invoice/charges/.json`;
      console.log(process.env.DELHIVERY_API_TOKEN)
      const response: AxiosResponse<any> = await firstValueFrom(
        this.httpService.get<any>(url, {
          baseURL: process.env.DELHIVERY_API_URL || '',
          headers: {
            'Authorization': `Token ${process.env.DELHIVERY_API_TOKEN || ''}`,
            'Content-Type': 'application/json',
          },
          params: {
            md: dto.md,
            ss: dto.ss,
            d_pin: dto.d_pin,
            o_pin: dto.o_pin,
            cgm: dto.cgm,
            pt: dto.pt,
            l: dto.l,
            b: dto.b,
            h: dto.h,
          },
        }),
      );

      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      console.error('Delhivery Error:', axiosError.response?.data || axiosError.message);
      throw new HttpException(
        axiosError.response?.data || 'Shipping calculation failed',
        axiosError.response?.status || 500,
      );
    }
  }
}
