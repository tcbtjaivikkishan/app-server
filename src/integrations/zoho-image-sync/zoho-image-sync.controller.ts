import { Controller, Post, Body, HttpCode, Logger } from '@nestjs/common';
import { ZohoImageSyncService } from './zoho-image-sync.service';

@Controller('zoho')
export class ZohoImageSyncController {
  private readonly logger = new Logger(ZohoImageSyncController.name);

  // ✅ Duplicate webhook prevention — in-memory lock
  private processingItems = new Set<string>();

  constructor(private readonly zohoImageSyncService: ZohoImageSyncService) {}

  @Post('webhook')
  @HttpCode(200)
  async handleItemSync(@Body() body: any) {
    this.logger.log('📩 Webhook received: ' + JSON.stringify(body));

    const payload = body?.JSONString ? JSON.parse(body.JSONString) : body;
    const itemId = payload?.item_id || payload?.itemId || payload?.id;
    const eventType = payload?.event_type || 'item_updated'; // zoho sends event_type

    if (!itemId) {
      this.logger.warn('No item_id in payload');
      return { status: 'ignored', reason: 'no item_id found' };
    }

    // ✅ Duplicate webhook guard
    if (this.processingItems.has(itemId)) {
      this.logger.warn(`⚠️ Already processing item ${itemId} — duplicate webhook ignored`);
      return { status: 'ignored', reason: 'already processing' };
    }

    this.processingItems.add(itemId);

    // ✅ Handle delete event
    if (eventType === 'item_deleted') {
      this.zohoImageSyncService
        .deactivateItem(String(itemId))
        .catch((err) => this.logger.error(`Deactivate failed: ${err.message}`))
        .finally(() => this.processingItems.delete(itemId));

      return { status: 'received', action: 'deactivate', itemId };
    }

    // Handle create/update
    this.zohoImageSyncService
      .syncItemImage(String(itemId))
      .catch((err) => this.logger.error(`Sync failed: ${err.message}`))
      .finally(() => this.processingItems.delete(itemId)); // ✅ always release lock

    return { status: 'received', action: 'sync', itemId };
  }
}