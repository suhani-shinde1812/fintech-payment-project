import { PrismaClient, OfferStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;
const DEMO_PASSWORD = 'Demo@123456';

async function main() {
  console.log('🌱 Starting PayLoop Campus seed...');

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);

  // ── CATEGORIES ──────────────────────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.merchantCategory.upsert({ where: { name: 'Food & Dining' }, update: {}, create: { name: 'Food & Dining', icon: '🍽️', description: 'Restaurants, cafes, and food courts' } }),
    prisma.merchantCategory.upsert({ where: { name: 'Shopping' }, update: {}, create: { name: 'Shopping', icon: '🛍️', description: 'Retail stores and online shopping' } }),
    prisma.merchantCategory.upsert({ where: { name: 'Education' }, update: {}, create: { name: 'Education', icon: '📚', description: 'Books, stationery, and educational services' } }),
    prisma.merchantCategory.upsert({ where: { name: 'Entertainment' }, update: {}, create: { name: 'Entertainment', icon: '🎬', description: 'Movies, games, and events' } }),
    prisma.merchantCategory.upsert({ where: { name: 'Fitness' }, update: {}, create: { name: 'Fitness', icon: '🏋️', description: 'Gyms and fitness centers' } }),
    prisma.merchantCategory.upsert({ where: { name: 'Services' }, update: {}, create: { name: 'Services', icon: '🔧', description: 'Laundry, printing, and other services' } }),
    prisma.merchantCategory.upsert({ where: { name: 'Travel' }, update: {}, create: { name: 'Travel', icon: '🚌', description: 'Local travel and transport' } }),
  ]);

  const [foodCat, shopCat, eduCat, entCat, fitCat, serCat, travelCat] = categories;

  console.log('✅ Categories created');

  // ── ADMIN ────────────────────────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@payloop.demo' },
    update: {},
    create: {
      email: 'admin@payloop.demo',
      passwordHash,
      name: 'PayLoop Admin',
      role: 'ADMIN',
      isActive: true
    }
  });

  console.log('✅ Admin created');

  // ── MERCHANTS ────────────────────────────────────────────────────────────────
  const merchantData = [
    { name: 'Priya Sharma', email: 'merchant@payloop.demo', business: 'Campus Cafe', category: foodCat.id, address: 'Block A, Campus Road, Bengaluru', phone: '9876543210', desc: 'Best coffee and snacks on campus' },
    { name: 'Rajesh Kumar', email: 'pizzahub@payloop.demo', business: 'Pizza Hub', category: foodCat.id, address: '2nd Cross, Koramangala, Bengaluru', phone: '9876543211', desc: 'Authentic Italian pizzas for students' },
    { name: 'Meera Nair', email: 'print@payloop.demo', business: 'Campus Print Center', category: serCat.id, address: 'Near Library Gate, Campus', phone: '9876543212', desc: 'Printing, scanning, and binding services' },
    { name: 'Arjun Singh', email: 'bookstore@payloop.demo', business: 'Scholar\'s Corner', category: eduCat.id, address: 'Main Market, BTM Layout', phone: '9876543213', desc: 'Books, stationery, and study materials' },
    { name: 'Kavitha Reddy', email: 'fitness@payloop.demo', business: 'FitZone Gym', category: fitCat.id, address: 'Indiranagar, Bengaluru', phone: '9876543214', desc: 'Modern gym with student discounts' },
    { name: 'Vikram Patel', email: 'cinema@payloop.demo', business: 'PVR Nexus Mall', category: entCat.id, address: 'Nexus Mall, Whitefield', phone: '9876543215', desc: 'Movies and entertainment' },
    { name: 'Sunita Gupta', email: 'fashion@payloop.demo', business: 'TrendZone Fashion', category: shopCat.id, address: 'Forum Mall, Koramangala', phone: '9876543216', desc: 'Trendy fashion for college students' },
    { name: 'Mohan Das', email: 'dosa@payloop.demo', business: 'Dosa Palace', category: foodCat.id, address: 'Jayanagar 4th Block', phone: '9876543217', desc: 'Authentic South Indian cuisine' },
    { name: 'Ananya Krishnan', email: 'laundry@payloop.demo', business: 'QuickWash Laundry', category: serCat.id, address: 'HSR Layout, Bengaluru', phone: '9876543218', desc: 'Quick laundry pickup and delivery' },
    { name: 'Rohit Verma', email: 'juice@payloop.demo', business: 'Fresh Juice Corner', category: foodCat.id, address: 'Campus Canteen Area', phone: '9876543219', desc: 'Fresh fruit juices and smoothies' },
  ];

  const merchants = [];
  for (const m of merchantData) {
    const user = await prisma.user.upsert({
      where: { email: m.email },
      update: {},
      create: {
        email: m.email,
        passwordHash,
        name: m.name,
        role: 'MERCHANT',
        isActive: true,
        merchantProfile: {
          create: {
            businessName: m.business,
            description: m.desc,
            categoryId: m.category,
            address: m.address,
            phone: m.phone,
            qrCode: `PLM-${uuidv4().substring(0, 8).toUpperCase()}`,
            status: 'APPROVED',
            totalSales: Math.floor(Math.random() * 100000) + 50000
          }
        }
      },
      include: { merchantProfile: true }
    });
    merchants.push(user);
  }

  console.log('✅ Merchants created');

  // ── STUDENTS ─────────────────────────────────────────────────────────────────
  const studentData = [
    { name: 'Suhani Mehta', email: 'student@payloop.demo', college: 'RVCE Bengaluru', course: 'B.Tech CSE', year: 3 },
    { name: 'Amit Sharma', email: 'amit@payloop.demo', college: 'BMS College', course: 'B.Tech ECE', year: 2 },
    { name: 'Rahul Nair', email: 'rahul@payloop.demo', college: 'PESIT Bengaluru', course: 'BCA', year: 1 },
    { name: 'Sneha Patel', email: 'sneha@payloop.demo', college: 'Christ University', course: 'MBA', year: 1 },
    { name: 'Aryan Kumar', email: 'aryan@payloop.demo', college: 'NMIMS Mumbai', course: 'B.Com', year: 2 },
    { name: 'Priya Singh', email: 'priya@payloop.demo', college: 'IIT Bombay', course: 'B.Tech ME', year: 4 },
    { name: 'Rohan Gupta', email: 'rohan@payloop.demo', college: 'Delhi University', course: 'BA Eco', year: 3 },
    { name: 'Ananya Das', email: 'ananya@payloop.demo', college: 'VIT Vellore', course: 'B.Tech IT', year: 2 },
    { name: 'Karan Reddy', email: 'karan@payloop.demo', college: 'Manipal University', course: 'MBBS', year: 3 },
    { name: 'Divya Krishnan', email: 'divya@payloop.demo', college: 'BITS Pilani', course: 'B.Tech CS', year: 1 },
    { name: 'Vivek Joshi', email: 'vivek@payloop.demo', college: 'SRM University', course: 'B.Tech AI', year: 2 },
    { name: 'Meera Agarwal', email: 'meera@payloop.demo', college: 'Symbiosis Pune', course: 'BBA', year: 3 },
    { name: 'Nikhil Tiwari', email: 'nikhil@payloop.demo', college: 'Anna University', course: 'B.Tech Civil', year: 4 },
    { name: 'Lakshmi Iyer', email: 'lakshmi@payloop.demo', college: 'Bangalore University', course: 'MSc Physics', year: 1 },
    { name: 'Aditya Rao', email: 'aditya@payloop.demo', college: 'Hyderabad University', course: 'B.Tech EEE', year: 2 },
    { name: 'Pooja Pandey', email: 'pooja@payloop.demo', college: 'Jadavpur University', course: 'B.Arch', year: 3 },
    { name: 'Sanjay Mishra', email: 'sanjay@payloop.demo', college: 'NIT Trichy', course: 'B.Tech Prod', year: 4 },
    { name: 'Riya Bose', email: 'riya@payloop.demo', college: 'Amity University', course: 'BA Journalism', year: 2 },
    { name: 'Tushar Jain', email: 'tushar@payloop.demo', college: 'IIM Ahmedabad', course: 'MBA Finance', year: 1 },
    { name: 'Shruti Kapoor', email: 'shruti@payloop.demo', college: 'Fergusson College', course: 'B.Sc CS', year: 3 },
  ];

  const students = [];
  for (const s of studentData) {
    const points = Math.floor(Math.random() * 4000) + 200;
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email: s.email,
        passwordHash,
        name: s.name,
        role: 'STUDENT',
        isActive: true,
        studentProfile: {
          create: {
            college: s.college,
            course: s.course,
            year: s.year,
            demoBalance: Math.floor(Math.random() * 8000) + 2000,
            totalPoints: points,
            level: points < 500 ? 1 : points < 1500 ? 2 : points < 3000 ? 3 : points < 6000 ? 4 : 5
          }
        }
      },
      include: { studentProfile: true }
    });
    students.push(user);
  }

  console.log('✅ Students created');

  // ── OFFERS ───────────────────────────────────────────────────────────────────
  const merchantProfiles = await prisma.merchantProfile.findMany();
  const cafeMerchant = merchantProfiles.find(m => m.businessName === 'Campus Cafe');
  const pizzaMerchant = merchantProfiles.find(m => m.businessName === 'Pizza Hub');
  const printMerchant = merchantProfiles.find(m => m.businessName === 'Campus Print Center');
  const bookMerchant = merchantProfiles.find(m => m.businessName === "Scholar's Corner");
  const gymMerchant = merchantProfiles.find(m => m.businessName === 'FitZone Gym');
  const cineMerchant = merchantProfiles.find(m => m.businessName === 'PVR Nexus Mall');
  const fashionMerchant = merchantProfiles.find(m => m.businessName === 'TrendZone Fashion');
  const dosaMerchant = merchantProfiles.find(m => m.businessName === 'Dosa Palace');
  const laundryMerchant = merchantProfiles.find(m => m.businessName === 'QuickWash Laundry');
  const juiceMerchant = merchantProfiles.find(m => m.businessName === 'Fresh Juice Corner');

  const futureDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
  const nearFuture = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

  const offerData = [
    { merchantId: cafeMerchant!.id, title: '₹50 OFF on Coffee', description: 'Get ₹50 off on any order above ₹250', discountType: 'FLAT', discountValue: 50, minSpend: 250, startDate: new Date(), endDate: futureDate, status: 'ACTIVE', categoryId: foodCat.id },
    { merchantId: cafeMerchant!.id, title: 'Buy 1 Get 1 Cappuccino', description: 'Buy one cappuccino and get the second free!', discountType: 'PERCENTAGE', discountValue: 50, minSpend: 150, startDate: new Date(), endDate: nearFuture, status: 'ACTIVE', categoryId: foodCat.id },
    { merchantId: pizzaMerchant!.id, title: '20% OFF on All Pizzas', description: 'Students get 20% off all pizzas. Show your college ID.', discountType: 'PERCENTAGE', discountValue: 20, minSpend: 0, maxDiscount: 150, startDate: new Date(), endDate: futureDate, status: 'ACTIVE', categoryId: foodCat.id },
    { merchantId: pizzaMerchant!.id, title: 'Free Garlic Bread', description: 'Get free garlic bread on orders above ₹500', discountType: 'FLAT', discountValue: 80, minSpend: 500, startDate: new Date(), endDate: nearFuture, status: 'ACTIVE', categoryId: foodCat.id },
    { merchantId: printMerchant!.id, title: '10% OFF on Printing', description: '10% discount on all printing and binding', discountType: 'PERCENTAGE', discountValue: 10, minSpend: 0, startDate: new Date(), endDate: futureDate, status: 'ACTIVE', categoryId: serCat.id },
    { merchantId: printMerchant!.id, title: 'Free Lamination', description: 'Get free A4 lamination on orders above ₹200', discountType: 'FLAT', discountValue: 30, minSpend: 200, startDate: new Date(), endDate: futureDate, status: 'ACTIVE', categoryId: serCat.id },
    { merchantId: bookMerchant!.id, title: '15% OFF on Textbooks', description: 'Flat 15% off on all engineering and management textbooks', discountType: 'PERCENTAGE', discountValue: 15, minSpend: 200, maxDiscount: 300, startDate: new Date(), endDate: futureDate, status: 'ACTIVE', categoryId: eduCat.id },
    { merchantId: gymMerchant!.id, title: '₹500 OFF Monthly Pass', description: 'Get ₹500 off on monthly gym membership with student ID', discountType: 'FLAT', discountValue: 500, minSpend: 1000, startDate: new Date(), endDate: futureDate, status: 'ACTIVE', categoryId: fitCat.id },
    { merchantId: cineMerchant!.id, title: 'Student Movie Tuesday', description: 'All tickets at just ₹99 on Tuesdays for students', discountType: 'FLAT', discountValue: 100, minSpend: 99, startDate: new Date(), endDate: futureDate, status: 'ACTIVE', categoryId: entCat.id },
    { merchantId: fashionMerchant!.id, title: '25% OFF Ethnic Wear', description: '25% off on all ethnic wear collections for students', discountType: 'PERCENTAGE', discountValue: 25, minSpend: 500, maxDiscount: 500, startDate: new Date(), endDate: futureDate, status: 'ACTIVE', categoryId: shopCat.id },
    { merchantId: dosaMerchant!.id, title: 'Student Meal Combo', description: 'Full meal combo at ₹89 for students. Dosa + Rice + Sambar', discountType: 'FLAT', discountValue: 30, minSpend: 89, startDate: new Date(), endDate: futureDate, status: 'ACTIVE', categoryId: foodCat.id },
    { merchantId: laundryMerchant!.id, title: '20% OFF First Order', description: 'Get 20% off on your first laundry order', discountType: 'PERCENTAGE', discountValue: 20, minSpend: 0, maxDiscount: 100, startDate: new Date(), endDate: futureDate, status: 'ACTIVE', categoryId: serCat.id },
    { merchantId: juiceMerchant!.id, title: 'Buy 2 Get 1 Free', description: 'Buy any 2 juices and get the 3rd free!', discountType: 'FLAT', discountValue: 60, minSpend: 120, startDate: new Date(), endDate: nearFuture, status: 'ACTIVE', categoryId: foodCat.id },
  ];

  const offers = [];
  for (const o of offerData) {
    const offer = await prisma.offer.create({ data: { ...o, status: o.status as OfferStatus, usedCount: Math.floor(Math.random() * 50), isStudentOnly: true } });
    offers.push(offer);
  }

  console.log('✅ Offers created');

  // ── REWARDS ──────────────────────────────────────────────────────────────────
  const rewardData = [
    { title: '₹50 Cafe Coupon', description: '₹50 off at Campus Cafe', type: 'COUPON', pointsCost: 500, value: 50, isActive: true },
    { title: '₹100 Pizza Voucher', description: '₹100 off at Pizza Hub', type: 'COUPON', pointsCost: 1000, value: 100, isActive: true },
    { title: '10% Discount Token', description: '10% off at any participating merchant', type: 'DISCOUNT', pointsCost: 750, value: 10, isActive: true },
    { title: 'Free Coffee', description: 'One free coffee at Campus Cafe', type: 'FREE_ITEM', pointsCost: 300, value: 80, isActive: true },
    { title: '₹200 Shopping Voucher', description: '₹200 off at TrendZone Fashion', type: 'COUPON', pointsCost: 2000, value: 200, isActive: true },
    { title: '₹150 Entertainment Pass', description: '₹150 off at PVR Nexus Mall', type: 'COUPON', pointsCost: 1500, value: 150, isActive: true },
    { title: 'Free Printing Pack', description: '20 free A4 pages at Campus Print', type: 'FREE_ITEM', pointsCost: 400, value: 40, isActive: true },
    { title: '₹500 Gym Pass', description: '₹500 off on monthly gym membership', type: 'DISCOUNT', pointsCost: 5000, value: 500, isActive: true },
    { title: '₹50 Simulated Cashback', description: 'Simulated cashback on next purchase', type: 'CASHBACK_SIMULATION', pointsCost: 500, value: 50, isActive: true },
    { title: '₹75 Book Coupon', description: '₹75 off on textbook purchase', type: 'COUPON', pointsCost: 800, value: 75, isActive: true },
  ];

  const rewards = [];
  for (const r of rewardData) {
    const reward = await prisma.reward.create({ data: { title: r.title, description: r.description, type: r.type as 'COUPON' | 'DISCOUNT' | 'CASHBACK_SIMULATION' | 'POINTS' | 'FREE_ITEM', pointsCost: r.pointsCost, value: r.value, isActive: r.isActive } });
    rewards.push(reward);
  }

  console.log('✅ Rewards created');

  // ── TRANSACTIONS ─────────────────────────────────────────────────────────────
  const studentProfiles = await prisma.studentProfile.findMany({ take: 5 });
  const approvedMerchants = await prisma.merchantProfile.findMany({ where: { status: 'APPROVED' } });

  const txCategories = ['Food', 'Shopping', 'Education', 'Entertainment', 'Services'];
  const txAmounts = [89, 120, 150, 180, 200, 250, 280, 300, 350, 400, 420, 450, 500, 89, 60, 150, 200, 350, 180];

  for (const studentProfile of studentProfiles) {
    const user = await prisma.user.findUnique({ where: { id: studentProfile.userId } });
    for (let i = 0; i < 20; i++) {
      const merchant = approvedMerchants[Math.floor(Math.random() * approvedMerchants.length)];
      const amount = txAmounts[Math.floor(Math.random() * txAmounts.length)];
      const points = Math.floor(amount * 0.05);
      const daysAgo = Math.floor(Math.random() * 60);
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const ref = `PL-DEMO-${uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase()}`;
      const category = txCategories[Math.floor(Math.random() * txCategories.length)];

      const tx = await prisma.transaction.create({
        data: {
          transactionRef: ref,
          studentId: studentProfile.id,
          merchantId: merchant.id,
          amount,
          status: 'COMPLETED',
          pointsEarned: points,
          createdAt,
          updatedAt: createdAt
        }
      });

      await prisma.payment.create({
        data: {
          transactionId: tx.id,
          senderId: studentProfile.userId,
          amount,
          status: 'COMPLETED',
          providerRef: `DEMO-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          providerName: 'DEMO',
          metadata: { note: 'DEMO PAYMENT — NO REAL MONEY WAS MOVED' },
          createdAt,
          updatedAt: createdAt
        }
      });

      await prisma.expense.create({
        data: {
          studentId: studentProfile.id,
          transactionId: tx.id,
          amount,
          category,
          description: `Payment to ${merchant.businessName}`,
          merchantName: merchant.businessName,
          date: createdAt,
          createdAt
        }
      });

      await prisma.rewardLedger.create({
        data: {
          studentId: studentProfile.id,
          points,
          description: 'Payment reward',
          transactionId: tx.id,
          createdAt
        }
      });
    }
  }

  console.log('✅ Transactions, payments, and expenses created');

  // ── SAVINGS GOALS ─────────────────────────────────────────────────────────────
  const mainStudent = studentProfiles[0];
  if (mainStudent) {
    await prisma.savingsGoal.createMany({
      data: [
        { studentId: mainStudent.id, title: 'New Laptop', goalType: 'LAPTOP', target: 60000, current: 18500 },
        { studentId: mainStudent.id, title: 'Goa Trip', goalType: 'TRIP', target: 15000, current: 8200 },
        { studentId: mainStudent.id, title: 'Emergency Fund', goalType: 'EMERGENCY_FUND', target: 10000, current: 3500 },
      ],
      skipDuplicates: true
    });
  }

  console.log('✅ Savings goals created');

  // ── BILLS ─────────────────────────────────────────────────────────────────────
  if (studentProfiles.length >= 4) {
    const [s1, s2, s3, s4] = studentProfiles;
    const billUsers = await prisma.user.findMany({
      where: { id: { in: [s1.userId, s2.userId, s3.userId, s4.userId] } }
    });

    if (billUsers.length >= 2) {
      await prisma.bill.create({
        data: {
          title: 'Dinner at Pizza Hub',
          total: 1500,
          creatorId: billUsers[0].id,
          splitType: 'EQUAL',
          status: 'PARTIALLY_PAID',
          participants: {
            create: [
              { userId: billUsers[0].id, amount: 375, isPaid: true, paidAt: new Date() },
              { userId: billUsers[1].id, amount: 375, isPaid: false },
              ...(billUsers[2] ? [{ userId: billUsers[2].id, amount: 375, isPaid: false }] : []),
              ...(billUsers[3] ? [{ userId: billUsers[3].id, amount: 375, isPaid: true, paidAt: new Date() }] : []),
            ]
          }
        }
      });
    }
  }

  console.log('✅ Bills created');

  // ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
  const mainUser = await prisma.user.findUnique({ where: { email: 'student@payloop.demo' } });
  if (mainUser) {
    await prisma.notification.createMany({
      data: [
        { userId: mainUser.id, type: 'REWARD', title: '🎉 You earned 50 Loop Points!', message: 'Great job! You earned 50 Loop Points from your last purchase at Campus Cafe.', isRead: false },
        { userId: mainUser.id, type: 'OFFER', title: '🔥 New offer available!', message: 'Pizza Hub is offering 20% off on all pizzas. Check it out!', isRead: false },
        { userId: mainUser.id, type: 'PAYMENT', title: '💳 Demo payment successful', message: 'Your demo payment of ₹280 to Campus Cafe was successful.', isRead: true },
        { userId: mainUser.id, type: 'SYSTEM', title: '👋 Welcome to PayLoop!', message: 'Welcome to PayLoop Campus! Start exploring offers and earning Loop Points.', isRead: true },
      ],
      skipDuplicates: true
    });
  }

  console.log('✅ Notifications created');

  // ── LOYALTY PROGRAMS ─────────────────────────────────────────────────────────
  if (cafeMerchant) {
    await prisma.loyaltyProgram.create({
      data: {
        merchantId: cafeMerchant.id,
        title: 'Coffee Loyalty Card',
        description: 'Buy 5 coffees, get 1 free!',
        ruleType: 'VISIT_COUNT',
        ruleValue: 5,
        rewardType: 'FREE_ITEM',
        rewardValue: 80,
        isActive: true
      }
    });
  }

  if (pizzaMerchant) {
    await prisma.loyaltyProgram.create({
      data: {
        merchantId: pizzaMerchant.id,
        title: 'Pizza Spender Reward',
        description: 'Spend ₹1,000 and get 100 Loop Points bonus',
        ruleType: 'SPEND_AMOUNT',
        ruleValue: 1000,
        rewardType: 'POINTS',
        rewardValue: 100,
        isActive: true
      }
    });
  }

  console.log('✅ Loyalty programs created');

  console.log('\n🎉 Seed complete! Demo accounts:');
  console.log('  Student: student@payloop.demo / Demo@123456');
  console.log('  Merchant: merchant@payloop.demo / Demo@123456');
  console.log('  Admin: admin@payloop.demo / Demo@123456');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
