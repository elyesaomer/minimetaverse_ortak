// scripts/migrate_to_mongo.js - data.json verilerini MongoDB Atlas / Yerel Veritabanına Aktarma Aracı
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const User = require('../src/models/User');

const DATA_FILE = path.resolve(__dirname, '../data.json');
const MONGO_URI = process.env.MONGO_URI;

async function runMigration() {
    console.log('--- DATA.JSON -> MONGODB AKTARIM ARACI ---');
    
    if (!MONGO_URI || MONGO_URI.includes('<kullanici_adi>') || MONGO_URI.includes('<username>') || MONGO_URI.includes('<password>') || MONGO_URI.includes('<sifre>')) {
        console.error('❌ HATA: .env dosyasında geçerli bir MONGO_URI bulunamadı!');
        console.log('👉 Lütfen .env dosyanızı açıp geçerli MongoDB bağlantı linkinizi girin:');
        console.log('   MONGO_URI=mongodb+srv://kullanici:sifre@cluster0.mongodb.net/mini_metaverse?retryWrites=true&w=majority\n');
        process.exit(1);
    }

    if (!fs.existsSync(DATA_FILE)) {
        console.error('❌ HATA: data.json dosyası bulunamadı:', DATA_FILE);
        process.exit(1);
    }

    try {
        console.log('🍃 MongoDB veritabanına bağlanılıyor...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB bağlantısı kuruldu.\n');

        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        const usersObj = parsed.users || {};
        const usernames = Object.keys(usersObj);

        console.log(`📁 data.json içinde ${usernames.length} adet kullanıcı bulundu.`);

        let insertedCount = 0;
        let updatedCount = 0;

        for (const uname of usernames) {
            const uData = usersObj[uname];
            const existing = await User.findOne({ username: { $regex: new RegExp(`^${uname}$`, 'i') } });

            if (existing) {
                // Mevcut kullanıcıyı data.json ile güncelle
                const doc = { ...uData, username: uname };
                delete doc._id;
                delete doc.__v;
                await User.updateOne({ _id: existing._id }, { $set: doc });
                updatedCount++;
                console.log(`🔄 Güncellendi: ${uname} (Bakiye: ${uData.money} TL, Evler: ${uData.houses ? Object.keys(uData.houses).join(', ') : 'Yok'})`);
            } else {
                // Yeni kullanıcı oluştur
                await User.create({
                    username: uname,
                    ...uData
                });
                insertedCount++;
                console.log(`➕ Eklendi: ${uname} (Bakiye: ${uData.money} TL, Evler: ${uData.houses ? Object.keys(uData.houses).join(', ') : 'Yok'})`);
            }
        }

        console.log('\n--- AKTARIM TAMAMLANDI ---');
        console.log(`✅ Yeni Eklenen: ${insertedCount}`);
        console.log(`✅ Güncellenen: ${updatedCount}`);
        console.log(`Toplam Kullanıcı Sayısı (MongoDB): ${await User.countDocuments()}`);

    } catch (err) {
        console.error('❌ Aktarım sırasında hata oluştu:', err);
    } finally {
        await mongoose.connection.close();
        console.log('🍃 MongoDB bağlantısı kapatıldı.');
        process.exit(0);
    }
}

runMigration();
