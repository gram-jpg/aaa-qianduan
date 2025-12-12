import { PrismaClient as AttachmentsPrismaClient } from '@prisma/attachments-client';
import { PrismaClient as AttachmentsPgClient } from '@prisma/attachments-pg-client';

const usePg = (process.env.DB_ENGINE || '').toLowerCase() === 'pg' || (process.env.DB_ENGINE || '').toLowerCase() === 'postgres' || (process.env.DB_ENGINE || '').toLowerCase() === 'postgresql';

export const attachmentsDb: any = usePg
    ? new AttachmentsPgClient({
        datasources: {
            db: {
                url: process.env.ATTACHMENTS_DATABASE_URL_PG || process.env.ATTACHMENTS_DATABASE_URL || 'postgresql://user:pass@localhost:5432/attachments'
            }
        }
    })
    : new AttachmentsPrismaClient({
        datasources: {
            db: {
                url: process.env.ATTACHMENTS_DATABASE_URL || 'file:./attachments.db'
            }
        }
    });

// Graceful shutdown
process.on('beforeExit', async () => {
    await attachmentsDb.$disconnect();
});
