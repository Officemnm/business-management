const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');

if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
} else {
  dotenv.config();
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const collection = mongoose.connection.collection('users');
  const users = await collection.find({}).toArray();
  console.log('Total users:', users.length);
  users.forEach(u => console.log(u.username, u.role));
  process.exit(0);
}
run().catch(console.error);