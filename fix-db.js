import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const OrderSchema = new mongoose.Schema({}, { strict: false });
const CustomerSchema = new mongoose.Schema({}, { strict: false });
const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
const Customer = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected DB');
  
  const orders = await Order.find({});
  let customerFixed = 0;
  let deliveryFixed = 0;
  
  for (let o of orders) {
    let changed = false;
    
    // Fix Delivery Date
    if (o.get('deliveryStatus') === 'delivered' && !o.get('deliveryDate')) {
      o.set('deliveryDate', o.get('updatedAt'));
      changed = true;
      deliveryFixed++;
    }
    
    // Fix missing customer IDs
    if (!o.get('customer') && o.get('customerName')) {
      const name = o.get('customerName').trim();
      let cust = await Customer.findOne({ name });
      if (!cust) {
        cust = await Customer.create({
          name: name,
          phone: "N/A",
          address: o.get('customerAddress') || "",
          totalDue: 0,
          active: true,
          createdBy: "system",
          createdAt: o.get('createdAt'),
          updatedAt: o.get('createdAt')
        });
      }
      o.set('customer', cust._id);
      changed = true;
      customerFixed++;
      
      // If the old order had due, make sure it reflects on the customer now (only if completed logic applies, but let's just add it if present)
      if (o.get('dueAmount') > 0) {
        await Customer.findByIdAndUpdate(cust._id, { $inc: { totalDue: o.get('dueAmount') } });
      }
    }
    
    if (changed) {
      await o.save();
    }
  }
  
  console.log('Finished. Customers fixed: ' + customerFixed + ', Deliveries fixed: ' + deliveryFixed);
  process.exit(0);
}
fix().catch(err => console.error(err));