import { Module, Global } from '@nestjs/common';
import { WebhookService } from './webhook.service';

@Global()
@Module({
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}
