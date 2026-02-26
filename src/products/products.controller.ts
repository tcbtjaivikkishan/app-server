import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

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

  // @Get(':id')
  // async getProduct(@Param('id') id: string) {
  //   return this.productModel.findById(id).lean();
  // }
}
