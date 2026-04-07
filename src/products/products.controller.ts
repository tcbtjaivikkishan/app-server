import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
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

  // ── BULK SYNC — must be declared BEFORE :id route ────────
  // POST /products/sync-all-images
  // Loops all products in MongoDB, fetches image from Zoho, uploads to S3
  @Post('sync-all-images')
  async syncAllImages() {
    return this.productsService.syncAllProductImages();
  }

  // POST /products/:id/sync-image
  // Body: { "zohoItemId": "123456789" }
  @Post(':id/sync-image')
  async syncImage(
    @Param('id') productId: string,
    @Body('zohoItemId') zohoItemId: string,
  ) {
    const imageUrl = await this.productsService.syncProductImage(
      productId,
      zohoItemId,
    );
    return { imageUrl };
  }
}


