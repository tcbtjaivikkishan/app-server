import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Product } from './schemas/product.schema';
import { Model } from 'mongoose';
import { ZohoService } from 'src/zoho/zoho.service';

@Injectable()
export class ProductsService {

  constructor(
    @InjectModel(Product.name)
    private productModel: Model<Product>,
    private zohoService: ZohoService,
  ) { }

  @Cron('*/30 * * * * *')
  async syncZohoProducts() {
    console.log('-------------------');
    console.log('Starting product sync...');

    try {
      const accessToken = await this.zohoService.getValidAccessToken();

      const response = await fetch(
        `https://www.zohoapis.in/inventory/v1/items?organization_id=${process.env.ZOHO_ORG_ID}`,
        {
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
          },
        },
      );

      const data = await response.json();
      const zohoItems = data.items || [];

      console.log('Zoho items count:', zohoItems.length);

      for (const item of zohoItems) {
        await this.productModel.updateOne(
          { zoho_item_id: item.item_id },
          {
            zoho_item_id: item.item_id,
            name: item.name,
            description: item.description,
            price: item.rate,
            sku: item.sku,
            stock: item.stock_on_hand,
            is_active: true,
          },
          { upsert: true },
        );
      }

      console.log('Product sync completed');
    } catch (error) {
      console.error('Product sync failed:', error.message);
    }
  }

  async getActiveProducts() {
    return this.productModel
      .find({ is_active: true })
      .select('name price sku stock description')
      .lean();
  }

  async getPaginatedProducts(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const products = await this.productModel
      .find({ is_active: true })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await this.productModel.countDocuments({
      is_active: true,
    });

    return {
      data: products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
