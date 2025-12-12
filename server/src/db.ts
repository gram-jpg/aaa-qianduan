import { PrismaClient as MainPrismaClient } from '@prisma/client';
import { PrismaClient as ShipmentPrismaClient } from '@prisma/shipment-client';
import { PrismaClient as AttachmentsPrismaClient } from '@prisma/attachments-client';
import { PrismaClient as FinancePrismaClient } from '@prisma/finance-client';
import { PrismaClient as LogPrismaClient } from '@prisma/log-client';
import { PrismaClient as MainPgClient } from '@prisma/main-pg-client';
import { PrismaClient as ShipmentPgClient } from '@prisma/shipment-pg-client';
import { PrismaClient as AttachmentsPgClient } from '@prisma/attachments-pg-client';
import { PrismaClient as FinancePgClient } from '@prisma/finance-pg-client';
import { PrismaClient as LogPgClient } from '@prisma/log-pg-client';

// 1. Main DB (Master Data)
const usePg = (process.env.DB_ENGINE || '').toLowerCase() === 'pg' || (process.env.DB_ENGINE || '').toLowerCase() === 'postgres' || (process.env.DB_ENGINE || '').toLowerCase() === 'postgresql';
export const mainDb: any = usePg ? new MainPgClient() : new MainPrismaClient();

// 2. Business DB (Shipments)
export const shipmentDb: any = usePg ? new ShipmentPgClient() : new ShipmentPrismaClient();

// 3. Finance DB (Costs, Invoices)
export const financeDb: any = usePg ? new FinancePgClient() : new FinancePrismaClient();

// 4. File DB (Attachments)
export const attachmentDb: any = usePg ? new AttachmentsPgClient() : new AttachmentsPrismaClient();

// 5. Log DB (Audit, Errors)
export const logDb: any = usePg ? new LogPgClient() : new LogPrismaClient();

// Legacy export (deprecate gradually)
export { mainDb as prisma };
