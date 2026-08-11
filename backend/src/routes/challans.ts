import { Router } from 'express';
import prisma from '../config/db';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { ChallanStatus } from '@prisma/client';

const router = Router();

// GET /challans - List challans with pagination, search, and status filters
router.get('/', authenticateJWT, async (req, res, next) => {
  try {
    const { status, search, page = '1', limit = '10' } = req.query;

    const pageNumber = parseInt(page as string, 10) || 1;
    const limitNumber = parseInt(limit as string, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const whereClause: any = {};

    if (status) {
      whereClause.status = status as ChallanStatus;
    }

    if (search) {
      whereClause.OR = [
        { challanNumber: { contains: search as string, mode: 'insensitive' } },
        {
          customer: {
            OR: [
              { name: { contains: search as string, mode: 'insensitive' } },
              { businessName: { contains: search as string, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const [challans, total] = await prisma.$transaction([
      prisma.salesChallan.findMany({
        where: whereClause,
        include: {
          customer: {
            select: { name: true, businessName: true },
          },
          creator: {
            select: { username: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNumber,
      }),
      prisma.salesChallan.count({ where: whereClause }),
    ]);

    res.status(200).json({
      success: true,
      data: challans,
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /challans/:id - Get specific challan details
router.get('/:id', authenticateJWT, async (req, res, next) => {
  try {
    const challanId = parseInt(req.params.id, 10);
    if (isNaN(challanId)) {
      return res.status(400).json({ success: false, message: 'Invalid challan ID' });
    }

    const challan = await prisma.salesChallan.findUnique({
      where: { id: challanId },
      include: {
        customer: true,
        creator: {
          select: { username: true, role: true },
        },
        items: {
          include: {
            product: {
              select: { currentStock: true, minStockAlert: true, location: true },
            },
          },
        },
      },
    });

    if (!challan) {
      return res.status(404).json({ success: false, message: 'Challan not found' });
    }

    res.status(200).json({ success: true, data: challan });
  } catch (error) {
    next(error);
  }
});

// POST /challans - Create a draft challan (ADMIN, SALES only)
router.post('/', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { customerId, items } = req.body;

    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Customer and items are required' });
    }

    // Validate customer exists
    const customer = await prisma.customer.findUnique({ where: { id: parseInt(customerId, 10) } });
    if (!customer) {
      return res.status(400).json({ success: false, message: 'Customer not found' });
    }

    // Generate unique challan number automatically
    // Format: CH-YYYY-[TIMESTAMP-6-DIGITS]-[RANDOM-3-DIGITS]
    const year = new Date().getFullYear();
    const tsPart = String(Date.now()).slice(-6);
    const randPart = Math.floor(100 + Math.random() * 900);
    const challanNumber = `CH-${year}-${tsPart}-${randPart}`;

    let totalQuantity = 0;

    // Build the items list with snapshot details from the database
    interface ChallanItemData {
      productId: number;
      quantity: number;
      priceAtSale: number;
      productNameSnapshot: string;
      skuSnapshot: string;
    }
    const challanItemsData: ChallanItemData[] = [];
    for (const item of items) {
      const prodId = parseInt(item.productId, 10);
      const qty = parseInt(item.quantity, 10);

      if (isNaN(prodId) || isNaN(qty) || qty <= 0) {
        return res.status(400).json({ success: false, message: 'Products must have positive integer quantities' });
      }

      const product = await prisma.product.findUnique({ where: { id: prodId } });
      if (!product) {
        return res.status(400).json({ success: false, message: `Product ID ${prodId} not found` });
      }

      totalQuantity += qty;

      challanItemsData.push({
        productId: prodId,
        quantity: qty,
        priceAtSale: product.unitPrice,
        productNameSnapshot: product.name,
        skuSnapshot: product.sku,
      });
    }

    // Save as Draft
    const challan = await prisma.salesChallan.create({
      data: {
        challanNumber,
        customerId: parseInt(customerId, 10),
        totalQuantity,
        status: ChallanStatus.Draft,
        createdBy: req.user!.id,
        items: {
          create: challanItemsData,
        },
      },
      include: {
        items: true,
      },
    });

    res.status(201).json({ success: true, message: 'Challan draft created', data: challan });
  } catch (error) {
    next(error);
  }
});

// PUT /challans/:id - Edit draft challan (ADMIN, SALES only)
router.put('/:id', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const challanId = parseInt(req.params.id, 10);
    if (isNaN(challanId)) {
      return res.status(400).json({ success: false, message: 'Invalid challan ID' });
    }

    const { items } = req.body;

    const existing = await prisma.salesChallan.findUnique({ where: { id: challanId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Challan not found' });
    }

    if (existing.status !== ChallanStatus.Draft) {
      return res.status(400).json({ success: false, message: 'Only draft challans can be updated' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Items list is required' });
    }

    let totalQuantity = 0;
    interface ChallanItemData {
      productId: number;
      quantity: number;
      priceAtSale: number;
      productNameSnapshot: string;
      skuSnapshot: string;
    }
    const challanItemsData: ChallanItemData[] = [];

    for (const item of items) {
      const prodId = parseInt(item.productId, 10);
      const qty = parseInt(item.quantity, 10);

      if (isNaN(prodId) || isNaN(qty) || qty <= 0) {
        return res.status(400).json({ success: false, message: 'Products must have positive integer quantities' });
      }

      const product = await prisma.product.findUnique({ where: { id: prodId } });
      if (!product) {
        return res.status(400).json({ success: false, message: `Product ID ${prodId} not found` });
      }

      totalQuantity += qty;

      challanItemsData.push({
        productId: prodId,
        quantity: qty,
        priceAtSale: product.unitPrice,
        productNameSnapshot: product.name,
        skuSnapshot: product.sku,
      });
    }

    // Delete old items and insert new ones inside a transaction
    const updatedChallan = await prisma.$transaction(async (tx) => {
      await tx.salesChallanItem.deleteMany({
        where: { challanId },
      });

      return tx.salesChallan.update({
        where: { id: challanId },
        data: {
          totalQuantity,
          items: {
            create: challanItemsData,
          },
        },
        include: {
          items: true,
        },
      });
    });

    res.status(200).json({ success: true, message: 'Challan draft updated', data: updatedChallan });
  } catch (error) {
    next(error);
  }
});

// POST /challans/:id/confirm - Confirm challan (ADMIN, SALES only)
// Deducts stock, creates stock OUT movements, updates status, handles safe transactions.
router.post('/:id/confirm', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const challanId = parseInt(req.params.id, 10);
    if (isNaN(challanId)) {
      return res.status(400).json({ success: false, message: 'Invalid challan ID' });
    }

    // Execute confirmation inside database transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get the challan
      const challan = await tx.salesChallan.findUnique({
        where: { id: challanId },
        include: { items: true },
      });

      if (!challan) {
        const err: any = new Error('Challan not found');
        err.status = 404;
        throw err;
      }

      // Rule 5: Prevent duplicate stock deduction
      if (challan.status === ChallanStatus.Confirmed) {
        const err: any = new Error('Challan is already confirmed');
        err.status = 400;
        throw err;
      }

      if (challan.status === ChallanStatus.Cancelled) {
        const err: any = new Error('Cancelled challans cannot be confirmed');
        err.status = 400;
        throw err;
      }

      // 2. Validate stock availability and decrement
      for (const item of challan.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          const err: any = new Error(`Product ${item.productNameSnapshot} (SKU: ${item.skuSnapshot}) not found`);
          err.status = 400;
          throw err;
        }

        // Rule 2 & 3: Stock must never become negative. Check availability.
        if (product.currentStock < item.quantity) {
          const err: any = new Error('Insufficient stock');
          err.status = 400;
          err.isStockError = true;
          err.details = {
            productId: item.productId,
            availableStock: product.currentStock,
            requestedQuantity: item.quantity,
          };
          throw err;
        }

        // Rule 1: Confirm challan reduces stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: {
              decrement: item.quantity,
            },
          },
        });

        // Rule 7 (Stock Movement): Log OUT movement
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: 'OUT',
            reason: `Sales Challan #${challan.challanNumber} Confirmation`,
            createdBy: req.user!.id,
          },
        });
      }

      // 3. Update Challan status
      return tx.salesChallan.update({
        where: { id: challanId },
        data: { status: ChallanStatus.Confirmed },
        include: {
          items: true,
          customer: true,
        },
      });
    });

    res.status(200).json({ success: true, message: 'Challan confirmed, inventory updated', data: result });
  } catch (error: any) {
    // If it is a stock error, return the requested specific error response format
    if (error.isStockError) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock',
        error: error.details,
      });
    }
    next(error);
  }
});

// POST /challans/:id/cancel - Cancel challan (ADMIN, SALES only)
// Cancel draft or confirmed challan (restores stock if it was confirmed)
router.post('/:id/cancel', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const challanId = parseInt(req.params.id, 10);
    if (isNaN(challanId)) {
      return res.status(400).json({ success: false, message: 'Invalid challan ID' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const challan = await tx.salesChallan.findUnique({
        where: { id: challanId },
        include: { items: true },
      });

      if (!challan) {
        const err: any = new Error('Challan not found');
        err.status = 404;
        throw err;
      }

      if (challan.status === ChallanStatus.Cancelled) {
        const err: any = new Error('Challan is already cancelled');
        err.status = 400;
        throw err;
      }

      // If it was Confirmed, we need to return the stock back!
      if (challan.status === ChallanStatus.Confirmed) {
        for (const item of challan.items) {
          // Increment stock
          await tx.product.update({
            where: { id: item.productId },
            data: {
              currentStock: {
                increment: item.quantity,
              },
            },
          });

          // Log IN movement
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              movementType: 'IN',
              reason: `Sales Challan #${challan.challanNumber} Cancellation (Stock Restored)`,
              createdBy: req.user!.id,
            },
          });
        }
      }

      // Update status
      return tx.salesChallan.update({
        where: { id: challanId },
        data: { status: ChallanStatus.Cancelled },
        include: { items: true },
      });
    });

    res.status(200).json({ success: true, message: 'Challan cancelled, stock adjusted if necessary', data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
