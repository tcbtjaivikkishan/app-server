/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
  ) {}

  @Cron('0 */30 * * * *')
  async syncZohoProducts() {
    console.log('Starting Zoho product sync...');

    try {
      const accessToken = await this.zohoService.getValidAccessToken();

      let page = 1;
      const perPage = 200;
      let hasMore = true;

      while (hasMore) {
        const response = await fetch(
          `https://www.zohoapis.in/inventory/v1/items?organization_id=${process.env.ZOHO_ORG_ID}&page=${page}&per_page=${perPage}`,
          {
            headers: {
              Authorization: `Zoho-oauthtoken ${accessToken}`,
            },
          },
        );

        const data = await response.json();
        const items = data.items || [];

        console.log(`Fetched page ${page} items: ${items.length}`);

        for (const item of items) {
          await this.productModel.updateOne(
            { zoho_item_id: item.item_id },
            {
              $set: {
                name: item.name,
                description: item.description,
                sku: item.sku,
                category_id: item.category_id,
                category_name: item.category_name,
                price: item.rate,
                stock: item.available_stock,
                track_inventory: item.track_inventory,
                zoho_image_document_id: item.image_document_id,
                show_in_storefront: item.show_in_storefront,
                weight: item.weight,
                length: item.length,
                width: item.width,
                height: item.height,
                is_active: item.status === 'active',
              },
              $setOnInsert: {
                zoho_item_id: item.item_id,
              },
            },
            { upsert: true },
          );
        }

        hasMore = items.length === perPage;
        page++;
      }

      console.log('Zoho product sync completed');
    } catch (error) {
      console.error('Zoho product sync failed:', error);
    }
  }

  async getActiveProducts() {
    return this.productModel
      .find({ is_active: true, show_in_storefront: true })
      .select('name price sku stock description image_url category_name')
      .lean();
  }

  async getPaginatedProducts(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const products = await this.productModel
      .find({ is_active: true, show_in_storefront: true })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await this.productModel.countDocuments({
      is_active: true,
      show_in_storefront: true,
    });

    return {
      data: products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
