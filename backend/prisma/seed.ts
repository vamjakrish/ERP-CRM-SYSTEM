import { PrismaClient, Role, CustomerType, CustomerStatus, MovementType, ChallanStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up existing database records...');
  // Delete in order of dependencies to avoid foreign key constraint violations
  await prisma.stockMovement.deleteMany({});
  await prisma.salesChallanItem.deleteMany({});
  await prisma.salesChallan.deleteMany({});
  await prisma.customerFollowUp.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.customer.deleteMany({});

  console.log('Seeding database...');

  // 1. Create/Upsert Users
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('admin123', salt);
  const salesPasswordHash = await bcrypt.hash('sales123', salt);
  const warehousePasswordHash = await bcrypt.hash('warehouse123', salt);
  const accountsPasswordHash = await bcrypt.hash('accounts123', salt);
  const princePasswordHash = await bcrypt.hash('prince123', salt);
  const rahulPasswordHash = await bcrypt.hash('rahul123', salt);
  const amitPasswordHash = await bcrypt.hash('amit123', salt);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: { passwordHash: adminPasswordHash },
    create: {
      username: 'admin',
      email: 'admin@company.com',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
  });

  const sales = await prisma.user.upsert({
    where: { email: 'sales@company.com' },
    update: { passwordHash: salesPasswordHash },
    create: {
      username: 'sales',
      email: 'sales@company.com',
      passwordHash: salesPasswordHash,
      role: Role.SALES,
    },
  });

  const warehouse = await prisma.user.upsert({
    where: { email: 'warehouse@company.com' },
    update: { passwordHash: warehousePasswordHash },
    create: {
      username: 'warehouse',
      email: 'warehouse@company.com',
      passwordHash: warehousePasswordHash,
      role: Role.WAREHOUSE,
    },
  });

  const accounts = await prisma.user.upsert({
    where: { email: 'accounts@company.com' },
    update: { passwordHash: accountsPasswordHash },
    create: {
      username: 'accounts',
      email: 'accounts@company.com',
      passwordHash: accountsPasswordHash,
      role: Role.ACCOUNTS,
    },
  });

  const prince = await prisma.user.upsert({
    where: { email: 'prince@company.com' },
    update: { passwordHash: princePasswordHash },
    create: {
      username: 'Prince',
      email: 'prince@company.com',
      passwordHash: princePasswordHash,
      role: Role.ADMIN,
    },
  });

  const rahul = await prisma.user.upsert({
    where: { email: 'rahul.sales@company.com' },
    update: { passwordHash: rahulPasswordHash },
    create: {
      username: 'Rahul',
      email: 'rahul.sales@company.com',
      passwordHash: rahulPasswordHash,
      role: Role.SALES,
    },
  });

  const amit = await prisma.user.upsert({
    where: { email: 'amit.warehouse@company.com' },
    update: { passwordHash: amitPasswordHash },
    create: {
      username: 'Amit Patel',
      email: 'amit.warehouse@company.com',
      passwordHash: amitPasswordHash,
      role: Role.WAREHOUSE,
    },
  });

  console.log('Users seeded successfully.');

  // 2. Create Customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'John Doe',
      mobile: '+15550199',
      email: 'john@acmeretail.com',
      businessName: 'Acme Retailers',
      gstNumber: '29AAAAA1111A1Z1',
      customerType: CustomerType.Retail,
      address: '123 Main St, New York, NY',
      status: CustomerStatus.Active,
      followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      notes: 'Initial contact made. Interested in bulk gears.',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Jane Smith',
      mobile: '+15550188',
      email: 'jane@globalwholesale.com',
      businessName: 'Global Wholesale Corp',
      gstNumber: '29BBBBB2222B2Z2',
      customerType: CustomerType.Wholesale,
      address: '456 Business Rd, Chicago, IL',
      status: CustomerStatus.Active,
      notes: 'Regular wholesale buyer. Requires monthly delivery of widgets.',
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: 'Robert Johnson',
      mobile: '+15550177',
      email: 'robert@apexdist.com',
      businessName: 'Apex Distributors',
      customerType: CustomerType.Distributor,
      address: '789 Logistics Blvd, Houston, TX',
      status: CustomerStatus.Lead,
      notes: 'Potential distributor lead from trade show.',
    },
  });

  const customer4 = await prisma.customer.create({
    data: {
      name: 'Test Customer',
      mobile: '+15550144',
      email: 'test@testenterprises.com',
      businessName: 'Test Enterprises',
      customerType: CustomerType.Retail,
      address: '741 Test Rd, Testville',
      status: CustomerStatus.Active,
    },
  });

  const customer5 = await prisma.customer.create({
    data: {
      name: 'Rakesh Patel',
      mobile: '+15550155',
      email: 'rakesh@shreekrishna.com',
      businessName: 'Shree Krishna Distributors',
      customerType: CustomerType.Distributor,
      address: '259 Krishna Way, Ahmedabad',
      status: CustomerStatus.Active,
    },
  });

  const customer6 = await prisma.customer.create({
    data: {
      name: 'Vikram Joshi',
      mobile: '+15550166',
      email: 'vikram@shreebalaji.com',
      businessName: 'Shree Balaji Traders',
      customerType: CustomerType.Wholesale,
      address: '376 Balaji Lane, Pune',
      status: CustomerStatus.Active,
    },
  });

  console.log('Customers seeded.');

  // Create initial Customer Follow Up Notes
  await prisma.customerFollowUp.createMany({
    data: [
      {
        customerId: customer1.id,
        note: 'Followed up via phone. Sent product catalog.',
        createdBy: sales.id,
      },
      {
        customerId: customer2.id,
        note: 'Sent price list for Widgets and Gears.',
        createdBy: sales.id,
      },
    ],
  });

  console.log('Customer follow ups seeded.');

  // 3. Create Products
  const product1 = await prisma.product.create({
    data: {
      name: 'Industrial Widget A',
      sku: 'WID-001',
      category: 'Widgets',
      unitPrice: 19.99,
      currentStock: 100,
      minStockAlert: 15,
      location: 'Aisle 3, Rack B',
    },
  });

  const product2 = await prisma.product.create({
    data: {
      name: 'Premium Gear B',
      sku: 'GER-002',
      category: 'Gears',
      unitPrice: 49.99,
      currentStock: 4, // 5 initially loaded, -1 from sales confirmation of Challan 4
      minStockAlert: 10,
      location: 'Aisle 1, Rack A',
    },
  });

  const product3 = await prisma.product.create({
    data: {
      name: 'Standard Bracket C',
      sku: 'BRA-003',
      category: 'Brackets',
      unitPrice: 9.99,
      currentStock: 50,
      minStockAlert: 10,
      location: 'Aisle 2, Rack C',
    },
  });

  const product4 = await prisma.product.create({
    data: {
      name: 'Test Widget',
      sku: 'TEST-SKU-001',
      category: 'Widgets',
      unitPrice: 25.50,
      currentStock: 5, // 10 initially loaded, -5 from sales confirmation of Challan 1
      minStockAlert: 5,
      location: 'Aisle 4, Rack D',
    },
  });

  const product5 = await prisma.product.create({
    data: {
      name: 'Surf Excel',
      sku: 'SURF-001',
      category: 'Detergents',
      unitPrice: 250.00,
      currentStock: 350, // 500 loaded, -100 (Challan 5), +100 (new stock), -150 (Challan 6) = 350
      minStockAlert: 50,
      location: 'Aisle 5, Rack E',
    },
  });

  const product6 = await prisma.product.create({
    data: {
      name: 'Dove',
      sku: 'DOVE-001',
      category: 'Soaps',
      unitPrice: 150.00,
      currentStock: 140, // 200 loaded, -50 (Challan 5), -10 (Challan 8) = 140
      minStockAlert: 30,
      location: 'Aisle 6, Rack F',
    },
  });

  console.log('Products seeded.');

  // 4. Create Sales Challans and Items
  const challan1 = await prisma.salesChallan.create({
    data: {
      challanNumber: 'CH-2026-741080-291',
      customerId: customer4.id,
      totalQuantity: 5,
      status: ChallanStatus.Confirmed,
      createdBy: sales.id,
      createdAt: new Date('2026-08-10T08:32:21.086Z'),
      items: {
        create: {
          productId: product4.id,
          quantity: 5,
          priceAtSale: 25.50,
          productNameSnapshot: 'Test Widget',
          skuSnapshot: 'TEST-SKU-001',
        }
      }
    }
  });

  const challan2 = await prisma.salesChallan.create({
    data: {
      challanNumber: 'CH-2026-741103-851',
      customerId: customer4.id,
      totalQuantity: 20,
      status: ChallanStatus.Draft,
      createdBy: sales.id,
      createdAt: new Date('2026-08-10T08:32:21.106Z'),
      items: {
        create: {
          productId: product4.id,
          quantity: 20,
          priceAtSale: 25.50,
          productNameSnapshot: 'Test Widget',
          skuSnapshot: 'TEST-SKU-001',
        }
      }
    }
  });

  const challan3 = await prisma.salesChallan.create({
    data: {
      challanNumber: 'CH-2026-431698-513',
      customerId: customer3.id,
      totalQuantity: 13,
      status: ChallanStatus.Draft,
      createdBy: sales.id,
      createdAt: new Date('2026-08-10T09:17:11.724Z'),
      items: {
        create: {
          productId: product2.id,
          quantity: 13,
          priceAtSale: 49.99,
          productNameSnapshot: 'Premium Gear B',
          skuSnapshot: 'GER-002',
        }
      }
    }
  });

  const challan4 = await prisma.salesChallan.create({
    data: {
      challanNumber: 'CH-2026-444620-502',
      customerId: customer3.id,
      totalQuantity: 1,
      status: ChallanStatus.Confirmed,
      createdBy: sales.id,
      createdAt: new Date('2026-08-10T09:17:24.623Z'),
      items: {
        create: {
          productId: product2.id,
          quantity: 1,
          priceAtSale: 49.99,
          productNameSnapshot: 'Premium Gear B',
          skuSnapshot: 'GER-002',
        }
      }
    }
  });

  const challan5 = await prisma.salesChallan.create({
    data: {
      challanNumber: 'CH-2026-259117-789',
      customerId: customer5.id,
      totalQuantity: 150,
      status: ChallanStatus.Confirmed,
      createdBy: sales.id,
      createdAt: new Date('2026-08-10T09:30:59.123Z'),
      items: {
        createMany: {
          data: [
            {
              productId: product5.id,
              quantity: 100,
              priceAtSale: 250.00,
              productNameSnapshot: 'Surf Excel',
              skuSnapshot: 'SURF-001',
            },
            {
              productId: product6.id,
              quantity: 50,
              priceAtSale: 150.00,
              productNameSnapshot: 'Dove',
              skuSnapshot: 'DOVE-001',
            }
          ]
        }
      }
    }
  });

  const challan6 = await prisma.salesChallan.create({
    data: {
      challanNumber: 'CH-2026-376442-278',
      customerId: customer6.id,
      totalQuantity: 150,
      status: ChallanStatus.Confirmed,
      createdBy: rahul.id,
      createdAt: new Date('2026-08-10T09:49:36.450Z'),
      items: {
        create: {
          productId: product5.id,
          quantity: 150,
          priceAtSale: 250.00,
          productNameSnapshot: 'Surf Excel',
          skuSnapshot: 'SURF-001',
        }
      }
    }
  });

  const challan7 = await prisma.salesChallan.create({
    data: {
      challanNumber: 'CH-2026-733136-273',
      customerId: customer6.id,
      totalQuantity: 1,
      status: ChallanStatus.Cancelled,
      createdBy: rahul.id,
      createdAt: new Date('2026-08-10T09:55:33.144Z'),
      items: {
        create: {
          productId: product6.id,
          quantity: 1,
          priceAtSale: 150.00,
          productNameSnapshot: 'Dove',
          skuSnapshot: 'DOVE-001',
        }
      }
    }
  });

  const challan8 = await prisma.salesChallan.create({
    data: {
      challanNumber: 'CH-2026-136414-690',
      customerId: customer2.id,
      totalQuantity: 10,
      status: ChallanStatus.Confirmed,
      createdBy: prince.id,
      createdAt: new Date('2026-08-10T10:02:16.422Z'),
      items: {
        create: {
          productId: product6.id,
          quantity: 10,
          priceAtSale: 150.00,
          productNameSnapshot: 'Dove',
          skuSnapshot: 'DOVE-001',
        }
      }
    }
  });

  console.log('Sales challans and items seeded.');

  // 5. Create Stock Movements
  await prisma.stockMovement.createMany({
    data: [
      {
        productId: product1.id,
        quantity: 100,
        movementType: MovementType.IN,
        reason: 'Initial inventory load',
        createdBy: warehouse.id,
        createdAt: new Date('2026-08-10T08:00:00Z'),
      },
      {
        productId: product2.id,
        quantity: 5,
        movementType: MovementType.IN,
        reason: 'Initial inventory load',
        createdBy: warehouse.id,
        createdAt: new Date('2026-08-10T08:01:00Z'),
      },
      {
        productId: product3.id,
        quantity: 50,
        movementType: MovementType.IN,
        reason: 'Initial inventory load',
        createdBy: warehouse.id,
        createdAt: new Date('2026-08-10T08:02:00Z'),
      },
      {
        productId: product4.id,
        quantity: 10,
        movementType: MovementType.IN,
        reason: 'Initial stock load on product creation',
        createdBy: warehouse.id,
        createdAt: new Date('2026-08-10T08:15:00Z'),
      },
      {
        productId: product4.id,
        quantity: 5,
        movementType: MovementType.OUT,
        reason: 'Sales Challan #CH-2026-741080-291 Confirmation',
        createdBy: sales.id,
        createdAt: new Date('2026-08-10T08:32:21.086Z'),
      },
      {
        productId: product2.id,
        quantity: 1,
        movementType: MovementType.OUT,
        reason: 'Sales Challan #CH-2026-444620-502 Confirmation',
        createdBy: sales.id,
        createdAt: new Date('2026-08-10T09:17:24.623Z'),
      },
      {
        productId: product5.id,
        quantity: 500,
        movementType: MovementType.IN,
        reason: 'Initial stock load for warehouse',
        createdBy: warehouse.id,
        createdAt: new Date('2026-08-10T09:20:00Z'),
      },
      {
        productId: product6.id,
        quantity: 200,
        movementType: MovementType.IN,
        reason: 'Initial stock load for warehouse',
        createdBy: warehouse.id,
        createdAt: new Date('2026-08-10T09:21:00Z'),
      },
      {
        productId: product5.id,
        quantity: 100,
        movementType: MovementType.OUT,
        reason: 'Sales Challan #CH-2026-259117-789 Confirmation',
        createdBy: sales.id,
        createdAt: new Date('2026-08-10T09:30:59.123Z'),
      },
      {
        productId: product6.id,
        quantity: 50,
        movementType: MovementType.OUT,
        reason: 'Sales Challan #CH-2026-259117-789 Confirmation',
        createdBy: sales.id,
        createdAt: new Date('2026-08-10T09:30:59.123Z'),
      },
      {
        productId: product5.id,
        quantity: 100,
        movementType: MovementType.IN,
        reason: 'New Stock availbale',
        createdBy: warehouse.id,
        createdAt: new Date('2026-08-10T09:40:00Z'),
      },
      {
        productId: product5.id,
        quantity: 150,
        movementType: MovementType.OUT,
        reason: 'Sales Challan #CH-2026-376442-278 Confirmation',
        createdBy: rahul.id,
        createdAt: new Date('2026-08-10T09:49:36.450Z'),
      },
      {
        productId: product6.id,
        quantity: 10,
        movementType: MovementType.OUT,
        reason: 'Sales Challan #CH-2026-136414-690 Confirmation',
        createdBy: prince.id,
        createdAt: new Date('2026-08-10T10:02:16.422Z'),
      },
    ],
  });

  console.log('Stock movements seeded successfully.');
  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
