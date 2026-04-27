import { Controller, Post, Body, HttpCode, Logger, Headers } from '@nestjs/common';
import { ZohoImageSyncService } from './zoho-image-sync.service';
import { ConfigService } from '@nestjs/config';

@Controller('zoho')
export class ZohoImageSyncController {
  private readonly logger = new Logger(ZohoImageSyncController.name);
  private processingItems = new Set<string>();

  constructor(
    private readonly zohoImageSyncService: ZohoImageSyncService,
    private readonly configService: ConfigService,
  ) { }

  // ✅ Validate webhook secret token
  private validateToken(token: string): boolean {
    const expected = this.configService.get('ZOHO_WEBHOOK_SECRET');
    if (expected && token !== expected) {
      this.logger.warn('⛔ Invalid webhook token — request rejected');
      return false;
    }
    return true;
  }

  // ✅ Extract item_id from any payload format
  private extractItemId(body: any): string | null {
    const payload = body?.JSONString ? JSON.parse(body.JSONString) : body;
    return payload?.item_id || payload?.itemId || payload?.id || null;
  }

  // ✅ Duplicate guard
  private isAlreadyProcessing(itemId: string): boolean {
    if (this.processingItems.has(itemId)) {
      this.logger.warn(`⚠️ Already processing ${itemId} — ignored`);
      return true;
    }
    return false;
  }

  // ✅ Item CREATED
  @Post('webhook/created')
  @HttpCode(200)
  async handleItemCreated(
    @Body() body: any,
    @Headers('x-zoho-webhook-token') token: string,
  ) {
    if (!this.validateToken(token)) return { status: 'rejected' };

    const itemId = this.extractItemId(body);
    this.logger.log(`📩 [CREATED] item_id: ${itemId}`);

    if (!itemId) return { status: 'ignored', reason: 'no item_id' };
    if (this.isAlreadyProcessing(itemId)) return { status: 'ignored', reason: 'already processing' };

    this.processingItems.add(itemId);
    this.zohoImageSyncService
      .syncItemImage(String(itemId))
      .catch((err) => this.logger.error(`Create sync failed: ${err.message}`))
      .finally(() => this.processingItems.delete(itemId));

    return { status: 'received', action: 'create', itemId };
  }

  // ✅ Item UPDATED
  @Post('webhook/updated')
  @HttpCode(200)
  async handleItemUpdated(
    @Body() body: any,
    @Headers('x-zoho-webhook-token') token: string,
  ) {
    if (!this.validateToken(token)) return { status: 'rejected' };

    const itemId = this.extractItemId(body);
    this.logger.log(`📩 [UPDATED] item_id: ${itemId}`);

    if (!itemId) return { status: 'ignored', reason: 'no item_id' };
    if (this.isAlreadyProcessing(itemId)) return { status: 'ignored', reason: 'already processing' };

    this.processingItems.add(itemId);
    this.zohoImageSyncService
      .syncItemImage(String(itemId))
      .catch((err) => this.logger.error(`Update sync failed: ${err.message}`))
      .finally(() => this.processingItems.delete(itemId));

    return { status: 'received', action: 'update', itemId };
  }

  // ✅ Item DELETED — no extra Zoho API call needed
  @Post('webhook/deleted')
  @HttpCode(200)
  async handleItemDeleted(
    @Body() body: any,
    @Headers('x-zoho-webhook-token') token: string,
  ) {
    if (!this.validateToken(token)) return { status: 'rejected' };

    const itemId = this.extractItemId(body);
    this.logger.log(`📩 [DELETED] item_id: ${itemId}`);

    if (!itemId) return { status: 'ignored', reason: 'no item_id' };
    if (this.isAlreadyProcessing(itemId)) return { status: 'ignored', reason: 'already processing' };

    this.processingItems.add(itemId);
    this.zohoImageSyncService
      .deleteItem(String(itemId))
      .catch((err) => this.logger.error(`Delete failed: ${err.message}`))
      .finally(() => this.processingItems.delete(itemId));

    return { status: 'received', action: 'delete', itemId };
  }

  // ✅ Fallback — old single webhook still works
  @Post('webhook')
  @HttpCode(200)
  async handleItemSync(
    @Body() body: any,
    @Headers('x-zoho-webhook-token') token: string,
  ) {
    if (!this.validateToken(token)) return { status: 'rejected' };

    const itemId = this.extractItemId(body);
    this.logger.log(`📩 [FALLBACK] item_id: ${itemId}`);

    if (!itemId) return { status: 'ignored', reason: 'no item_id' };
    if (this.isAlreadyProcessing(itemId)) return { status: 'ignored', reason: 'already processing' };

    this.processingItems.add(itemId);
    this.zohoImageSyncService
      .syncItemImage(String(itemId))
      .catch((err) => this.logger.error(`Sync failed: ${err.message}`))
      .finally(() => this.processingItems.delete(itemId));

    return { status: 'received', action: 'sync', itemId };
  }
}