import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

mongoose.connect(process.env.MONGODB_URI);

const Order = mongoose.model("Order", new mongoose.Schema({ orderNumber: String }, { strict: false }));

async function run() {
  const orders = await Order.find({ $or: [{ orderNumber: { $exists: false } }, { orderNumber: null }] });
  for (const o of orders) {
    const orderNumber = `ORD-${Date.now().toString().slice(-5)}${Math.floor(100 + Math.random() * 900)}`;
    o.orderNumber = orderNumber;
    await o.save();
    console.log("Updated", o._id, "with", orderNumber);
  }
  console.log("Done");
  process.exit(0);
}
run();