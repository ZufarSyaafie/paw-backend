const mongoose = require('mongoose');
require('dotenv').config();

async function clearDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/perpustakaan_naratama');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    for (let collection of collections) {
      await mongoose.connection.db.collection(collection.name).deleteMany({});
      console.log(`Cleared collection: ${collection.name}`);
    }
    
    console.log('✅ Database cleared successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  }
}

clearDatabase();