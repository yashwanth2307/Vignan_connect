import { Module, Global } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { EmailModule } from '../email/email.module';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [EmailModule, PrismaModule],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}
