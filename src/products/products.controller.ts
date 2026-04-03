import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { isValidObjectId } from 'mongoose';

@Controller('products')
export class ProductsController {

  constructor(private productsService: ProductsService) { }

  @Get()
  async getProducts(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.productsService.getPaginatedProducts(
      Number(page),
      Number(limit),
    );
  }

  @Get('/id/:id')
  async getProduct(@Param('id') id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid product ID');
    }

    return this.productsService.getProductById(id);
  }

  @Get('/filter')
  async getFilteredProducts(@Query() query: any) {
    return this.productsService.getFilteredProducts(query);
  }
}
