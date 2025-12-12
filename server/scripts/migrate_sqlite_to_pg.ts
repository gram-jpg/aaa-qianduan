import dotenv from 'dotenv';
import { PrismaClient as MainSqlite } from '@prisma/client';
import { PrismaClient as ShipmentSqlite } from '@prisma/shipment-client';
import { PrismaClient as FinanceSqlite } from '@prisma/finance-client';
import { PrismaClient as AttachmentsSqlite } from '@prisma/attachments-client';
import { PrismaClient as LogSqlite } from '@prisma/log-client';

import { PrismaClient as MainPg } from '@prisma/main-pg-client';
import { PrismaClient as ShipmentPg } from '@prisma/shipment-pg-client';
import { PrismaClient as FinancePg } from '@prisma/finance-pg-client';
import { PrismaClient as AttachmentsPg } from '@prisma/attachments-pg-client';
import { PrismaClient as LogPg } from '@prisma/log-pg-client';

dotenv.config({ path: '.env' });

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function copyTable(src: any, dst: any, model: string) {
  const s = (src as any)[model];
  const d = (dst as any)[model];
  if (!s || !d) return;
  const rows = await s.findMany();
  if (!rows.length) return;
  const batches = chunk(rows, 1000);
  for (const batch of batches) {
    await d.createMany({ data: batch, skipDuplicates: true });
  }
  console.log(`✔ ${model}: ${rows.length} rows copied`);
}

async function migrateMain(sqlite: any, pg: any) {
  console.log('→ Migrating MAIN DB');
  await copyTable(sqlite, pg, 'supplierType');
  await copyTable(sqlite, pg, 'transportType');
  await copyTable(sqlite, pg, 'businessType');
  await copyTable(sqlite, pg, 'tradeTerms');
  await copyTable(sqlite, pg, 'loadingMethod');
  await copyTable(sqlite, pg, 'port');
  await copyTable(sqlite, pg, 'financialSubject');
  await copyTable(sqlite, pg, 'customer');
  await copyTable(sqlite, pg, 'supplier');
  await copyTable(sqlite, pg, 'bankAccount');
  await copyTable(sqlite, pg, 'companyInfo');
}

async function migrateShipment(sqlite: any, pg: any) {
  console.log('→ Migrating SHIPMENT DB');
  await copyTable(sqlite, pg, 'shipment');
  await copyTable(sqlite, pg, 'shipmentCommodity');
  await copyTable(sqlite, pg, 'shipmentAttachment');
  await copyTable(sqlite, pg, 'shipmentCodeSequence');
}

async function migrateFinance(sqlite: any, pg: any) {
  console.log('→ Migrating FINANCE DB');
  await copyTable(sqlite, pg, 'shipmentCost');
  await copyTable(sqlite, pg, 'invoice');
  await copyTable(sqlite, pg, 'expenseApplication');
}

async function migrateAttachments(sqlite: any, pg: any) {
  console.log('→ Migrating ATTACHMENTS DB');
  await copyTable(sqlite, pg, 'attachment');
  await copyTable(sqlite, pg, 'attachmentAccessLog');
  await copyTable(sqlite, pg, 'coldStorageMigration');
}

async function migrateLog(sqlite: any, pg: any) {
  console.log('→ Migrating LOG DB');
  await copyTable(sqlite, pg, 'systemLog');
  await copyTable(sqlite, pg, 'auditLog');
}

async function main() {
  // Instantiate clients with explicit datasources from env
  const mainPg = new MainPg({ datasources: { db: { url: process.env.DATABASE_URL_PG as string } } });
  const shipmentPg = new ShipmentPg({ datasources: { db: { url: process.env.SHIPMENT_DATABASE_URL_PG as string } } });
  const financePg = new FinancePg({ datasources: { db: { url: process.env.FINANCE_DATABASE_URL_PG as string } } });
  const attachmentsPg = new AttachmentsPg({ datasources: { db: { url: process.env.ATTACHMENTS_DATABASE_URL_PG as string } } });
  const logPg = new LogPg({ datasources: { db: { url: process.env.LOG_DATABASE_URL_PG as string } } });

  const mainSqlite = new MainSqlite({ datasources: { db: { url: process.env.DATABASE_URL as string } } });
  const shipmentSqlite = new ShipmentSqlite({ datasources: { db: { url: process.env.SHIPMENT_DATABASE_URL as string } } });
  const financeSqlite = new FinanceSqlite({ datasources: { db: { url: process.env.FINANCE_DATABASE_URL as string } } });
  const attachmentsSqlite = new AttachmentsSqlite({ datasources: { db: { url: process.env.ATTACHMENTS_DATABASE_URL as string } } });
  const logSqlite = new LogSqlite({ datasources: { db: { url: process.env.LOG_DATABASE_URL as string } } });

  try {
    await migrateMain(mainSqlite, mainPg);
    await migrateShipment(shipmentSqlite, shipmentPg);
    await migrateFinance(financeSqlite, financePg);
    await migrateAttachments(attachmentsSqlite, attachmentsPg);
    await migrateLog(logSqlite, logPg);
    console.log('🎉 Migration completed');
  } finally {
    await mainPg.$disconnect();
    await shipmentPg.$disconnect();
    await financePg.$disconnect();
    await attachmentsPg.$disconnect();
    await logPg.$disconnect();
    await mainSqlite.$disconnect();
    await shipmentSqlite.$disconnect();
    await financeSqlite.$disconnect();
    await attachmentsSqlite.$disconnect();
    await logSqlite.$disconnect();
  }
}

main().catch((e) => {
  console.error('❌ Migration failed:', e);
  process.exit(1);
});

