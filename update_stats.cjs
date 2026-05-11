const fs = require('fs');
let code = fs.readFileSync('src/app/api/dashboard/stats/route.ts', 'utf8');

code = code.replace(
  'import { NextResponse } from "next/server";',
  'import { NextRequest, NextResponse } from "next/server";\nimport { verifyToken } from "@/lib/jwt";'
);

code = code.replace(
  'export async function GET(req: Request) {',
  `export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || !payload.userId) return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  const userId = payload.userId;
`
);

let orderFilter = `
      const orders = await Order.find({
        createdBy: userId,
        createdAt: { $gte: fromDate, $lte: toDate },
      }).lean();
      
      const deliveredOrdersWithPaidDate = await Order.find({
         createdBy: userId,
         $or: [
            { deliveryDate: { $gte: fromDate, $lte: toDate } },
            { createdAt: { $gte: fromDate, $lte: toDate }, deliveryDate: { $exists: false } }
         ]
      }).lean();
`;
code = code.replace(
/      const orders = await Order\.find\(\{\s*createdAt: \{ \$gte: fromDate, \$lte: toDate \},\s*\}\)\.lean\(\);\s*const deliveredOrdersWithPaidDate = await Order\.find\(\{\s*\$or: \[\s*\{ deliveryDate: \{ \$gte: fromDate, \$lte: toDate \} \},\s*\{ createdAt: \{ \$gte: fromDate, \$lte: toDate \}, deliveryDate: \{ \$exists: false \} \}\s*\]\s*\}\)\.lean\(\);/g,
  orderFilter
);

let countsReplace = `
    const userFilter = { createdBy: userId };
    const customerFilter = { createdBy: userId, active: true };

    const [totalOrders, totalCustomers, totalProducts, allOrders, dueCustomers, todayOrders, todayDeliveredOrders, allPayments, todayPayments] = await Promise.all([
      Order.countDocuments(userFilter),
      Customer.countDocuments(customerFilter),
      Product.countDocuments({ active: true }),
      Order.find(userFilter).lean(),
      Customer.find({ ...customerFilter, totalDue: { $gt: 0 } }).lean(),
      Order.find({ ...userFilter, createdAt: { $gte: todayStart, $lte: todayEnd } }).lean(),
      Order.find({ ...userFilter, deliveryDate: { $gte: todayStart, $lte: todayEnd } }).lean(),
      Payment.find({ collectedBy: userId }).sort({ createdAt: -1 }).lean(),
      Payment.find({ collectedBy: userId, createdAt: { $gte: todayStart, $lte: todayEnd } }).lean(),
    ]);
`;

code = code.replace(
/    const \[totalOrders, totalCustomers, totalProducts, allOrders, dueCustomers, todayOrders, todayDeliveredOrders, allPayments, todayPayments\] = await Promise\.all\(\[\s*Order\.countDocuments\(\),\s*Customer\.countDocuments\(\{ active: true \}\),\s*Product\.countDocuments\(\{ active: true \}\),\s*Order\.find\(\)\.lean\(\),\s*Customer\.find\(\{ totalDue: \{ \$gt: 0 \}, active: true \}\)\.lean\(\),\s*Order\.find\(\{ createdAt: \{ \$gte: todayStart, \$lte: todayEnd \} \}\)\.lean\(\),\s*Order\.find\(\{ deliveryDate: \{ \$gte: todayStart, \$lte: todayEnd \} \}\)\.lean\(\),\s*Payment\.find\(\)\.sort\(\{ createdAt: -1 \}\)\.lean\(\),\s*Payment\.find\(\{ createdAt: \{ \$gte: todayStart, \$lte: todayEnd \} \}\)\.lean\(\),\s*\]\);/,
  countsReplace
);

code = code.replace(
  'const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(10).lean();',
  'const recentOrders = await Order.find({ createdBy: userId }).sort({ createdAt: -1 }).limit(10).lean();'
);

code = code.replace(
  'const recentPayments = await Payment.find({ amount: { $gt: 0 } }).sort({ createdAt: -1 }).limit(10).lean();',
  'const recentPayments = await Payment.find({ collectedBy: userId, amount: { $gt: 0 } }).sort({ createdAt: -1 }).limit(10).lean();'
);

fs.writeFileSync('src/app/api/dashboard/stats/route.ts', code, 'utf8');
console.log("Stats API updated");
