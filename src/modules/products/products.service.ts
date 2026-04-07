import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Product } from './schemas/product.schema';
import { Model } from 'mongoose';
import { ZohoInventoryService } from '../../zoho/inventory/inventory.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private productModel: Model<Product>,
    private zohoInventoryService: ZohoInventoryService,
  ) {}

  // 🔁 Sync products every 30 minutes
  @Cron('0 */30 * * * *')
  async syncZohoProducts() {
    console.log('Starting Zoho product sync...');

    try {
      let page = 1;
      const perPage = 200;
      let hasMore = true;

      while (hasMore) {
        // ✅ Fetch from Zoho via service (NO direct API call here)
        const response =
          await this.zohoInventoryService.getItems(page, perPage);

        const items = response.items || [];

        console.log(`Fetched page ${page} items: ${items.length}`);

        for (const item of items) {
          try {
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
          } catch (error) {
            console.error(
              `Failed to upsert product ${item.item_id}:`,
              error,
            );
          }
        }

        hasMore = items.length === perPage;
        page++;
      }

      console.log('Zoho product sync completed');
    } catch (error) {
      console.error('Zoho product sync failed:', error);
    }
  }

  // 🔹 Get all active products
  async getActiveProducts() {
    return this.productModel
      .find({ is_active: true, show_in_storefront: true })
      .select(
        'name price sku stock description image_url category_name',
      )
      .lean();
  }

  // 🔹 Pagination
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

  // 🔹 Get single product
  async getProductById(id: string) {
    const product = await this.productModel
      .findOne({
        $or: [{ _id: id }, { zoho_item_id: id }],
      })
      .lean();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  // 🔹 Filtered products
  async getFilteredProducts(query: any) {
    let {
      page = 1,
      limit = 20,
      category,
      minPrice,
      maxPrice,
      search,
    } = query;

    page = Number(page);
    limit = Math.min(Number(limit), 50);

    const filter: any = {
      is_active: true,
      show_in_storefront: true,
    };

    // ✅ Category filter
    if (category) {
      filter.$and = [
        {
          $or: [
            { category_id: category },
            { category_name: category },
          ],
        },
      ];
    }

    // ✅ Price filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // ✅ Search
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const products = await this.productModel
      .find(filter)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await this.productModel.countDocuments(filter);

    return {
      data: products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}