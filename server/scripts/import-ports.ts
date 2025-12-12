import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const initialPorts = [
    // China Ports
    { code: 'CNSHA', nameEn: 'Shanghai', nameCn: '上海', country: 'CN', countryName: 'China' },
    { code: 'CNNGB', nameEn: 'Ningbo', nameCn: '宁波', country: 'CN', countryName: 'China' },
    { code: 'CNSZX', nameEn: 'Shenzhen', nameCn: '深圳', country: 'CN', countryName: 'China' },
    { code: 'CNGZH', nameEn: 'Guangzhou', nameCn: '广州', country: 'CN', countryName: 'China' },
    { code: 'CNQIN', nameEn: 'Qingdao', nameCn: '青岛', country: 'CN', countryName: 'China' },
    { code: 'CNTXG', nameEn: 'Tianjin', nameCn: '天津', country: 'CN', countryName: 'China' },
    { code: 'CNXMN', nameEn: 'Xiamen', nameCn: '厦门', country: 'CN', countryName: 'China' },
    { code: 'CNDLC', nameEn: 'Dalian', nameCn: '大连', country: 'CN', countryName: 'China' },
    { code: 'CNLYG', nameEn: 'Lianyungang', nameCn: '连云港', country: 'CN', countryName: 'China' },
    { code: 'CNFOC', nameEn: 'Fuzhou', nameCn: '福州', country: 'CN', countryName: 'China' },

    // Thailand Ports
    { code: 'THBKK', nameEn: 'Bangkok', nameCn: '曼谷', country: 'TH', countryName: 'Thailand' },
    { code: 'THLCH', nameEn: 'Laem Chabang', nameCn: '林查班', country: 'TH', countryName: 'Thailand' },
    { code: 'THSGZ', nameEn: 'Songkhla', nameCn: '宋卡', country: 'TH', countryName: 'Thailand' },
    { code: 'THPKT', nameEn: 'Phuket', nameCn: '普吉', country: 'TH', countryName: 'Thailand' },

    // Hong Kong & Singapore
    { code: 'HKHKG', nameEn: 'Hong Kong', nameCn: '香港', country: 'HK', countryName: 'Hong Kong' },
    { code: 'SGSIN', nameEn: 'Singapore', nameCn: '新加坡', country: 'SG', countryName: 'Singapore' },

    // Japan Ports
    { code: 'JPYOK', nameEn: 'Yokohama', nameCn: '横滨', country: 'JP', countryName: 'Japan' },
    { code: 'JPTYO', nameEn: 'Tokyo', nameCn: '东京', country: 'JP', countryName: 'Japan' },
    { code: 'JPOSA', nameEn: 'Osaka', nameCn: '大阪', country: 'JP', countryName: 'Japan' },

    // South Korea
    { code: 'KRPUS', nameEn: 'Busan', nameCn: '釜山', country: 'KR', countryName: 'South Korea' },
    { code: 'KRINC', nameEn: 'Incheon', nameCn: '仁川', country: 'KR', countryName: 'South Korea' },

    // USA Ports
    { code: 'USNYC', nameEn: 'New York', nameCn: '纽约', country: 'US', countryName: 'United States' },
    { code: 'USLAX', nameEn: 'Los Angeles', nameCn: '洛杉矶', country: 'US', countryName: 'United States' },
    { code: 'USOAK', nameEn: 'Oakland', nameCn: '奥克兰', country: 'US', countryName: 'United States' },
    { code: 'USSEA', nameEn: 'Seattle', nameCn: '西雅图', country: 'US', countryName: 'United States' },

    // Europe Ports
    { code: 'DEHAM', nameEn: 'Hamburg', nameCn: '汉堡', country: 'DE', countryName: 'Germany' },
    { code: 'NLRTM', nameEn: 'Rotterdam', nameCn: '鹿特丹', country: 'NL', countryName: 'Netherlands' },
    { code: 'GBLON', nameEn: 'London', nameCn: '伦敦', country: 'GB', countryName: 'United Kingdom' },
    { code: 'BEANR', nameEn: 'Antwerp', nameCn: '安特卫普', country: 'BE', countryName: 'Belgium' },
];

async function importPorts() {
    console.log('Starting port data import...');

    try {
        let created = 0;
        let skipped = 0;

        for (const portData of initialPorts) {
            const existing = await prisma.port.findUnique({
                where: { code: portData.code }
            });

            if (existing) {
                console.log(`Skipping ${portData.code} - already exists`);
                skipped++;
                continue;
            }

            await prisma.port.create({
                data: portData
            });

            console.log(`Created port: ${portData.code} - ${portData.nameEn} (${portData.nameCn})`);
            created++;
        }

        console.log(`\nImport complete!`);
        console.log(`Created: ${created} ports`);
        console.log(`Skipped: ${skipped} ports (already exist)`);
        console.log(`Total: ${initialPorts.length} ports processed`);

    } catch (error) {
        console.error('Error importing ports:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

importPorts()
    .then(() => {
        console.log('Port import script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Port import script failed:', error);
        process.exit(1);
    });
