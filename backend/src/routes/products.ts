import { Router } from 'express';
import prisma from '../config/db';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { MovementType } from '@prisma/client';

const router = Router();

// GET /products - Search and list products with pagination
router.get('/', authenticateJWT, async (req, res, next) => {
  try {
    const { search, page = '1', limit = '10', category } = req.query;

    const pageNumber = parseInt(page as string, 10) || 1;
    const limitNumber = parseInt(limit as string, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { sku: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (category) {
      whereClause.category = category as string;
    }

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where: whereClause,
        orderBy: { name: 'asc' },
        skip,
        take: limitNumber,
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    // Add stock status dynamically to each product
    const productsWithStatus = products.map((product) => {
      const isLowStock = product.currentStock <= product.minStockAlert;
      return {
        ...product,
        stockStatus: isLowStock ? 'LOW_STOCK' : 'OK',
      };
    });

    res.status(200).json({
      success: true,
      data: productsWithStatus,
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

// GET /products/:id - Single product view
router.get('/:id', authenticateJWT, async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const isLowStock = product.currentStock <= product.minStockAlert;
    res.status(200).json({
      success: true,
      data: {
        ...product,
        stockStatus: isLowStock ? 'LOW_STOCK' : 'OK',
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /products - Create product (ADMIN, WAREHOUSE only)
router.post('/', authenticateJWT, authorizeRoles('ADMIN', 'WAREHOUSE'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { name, sku, category, unitPrice, currentStock, minStockAlert, location, reason } = req.body;

    // Validation
    if (!name || !sku || !category || unitPrice === undefined || currentStock === undefined || minStockAlert === undefined || !location) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (unitPrice < 0) {
      return res.status(400).json({ success: false, message: 'Unit price cannot be negative' });
    }

    if (currentStock < 0) {
      return res.status(400).json({ success: false, message: 'Initial stock cannot be negative' });
    }

    if (minStockAlert < 0) {
      return res.status(400).json({ success: false, message: 'Minimum stock alert level cannot be negative' });
    }

    // Check SKU unique
    const existingSku = await prisma.product.findUnique({ where: { sku } });
    if (existingSku) {
      return res.status(400).json({ success: false, message: `Product with SKU ${sku} already exists` });
    }

    // Create product and stock movement in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name,
          sku,
          category,
          unitPrice: parseFloat(unitPrice),
          currentStock: parseInt(currentStock, 10),
          minStockAlert: parseInt(minStockAlert, 10),
          location,
        },
      });

      if (parseInt(currentStock, 10) > 0) {
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            quantity: parseInt(currentStock, 10),
            movementType: MovementType.IN,
            reason: reason || 'Initial stock load on product creation',
            createdBy: req.user!.id,
          },
        });
      }

      return product;
    });

    res.status(201).json({ success: true, message: 'Product created successfully', data: result });
  } catch (error) {
    next(error);
  }
});

// PUT /products/:id - Edit product details / adjust stock (ADMIN, WAREHOUSE only)
router.put('/:id', authenticateJWT, authorizeRoles('ADMIN', 'WAREHOUSE'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const { name, sku, category, unitPrice, currentStock, minStockAlert, location, reason } = req.body;

    const existingProduct = await prisma.product.findUnique({ where: { id: productId } });
    if (!existingProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (sku && sku !== existingProduct.sku) {
      const skuCheck = await prisma.product.findUnique({ where: { sku } });
      if (skuCheck) {
        return res.status(400).json({ success: false, message: `SKU ${sku} is already assigned to another product` });
      }
    }

    if (unitPrice !== undefined && unitPrice < 0) {
      return res.status(400).json({ success: false, message: 'Unit price cannot be negative' });
    }

    if (currentStock !== undefined && currentStock < 0) {
      return res.status(400).json({ success: false, message: 'Current stock cannot be negative' });
    }

    if (minStockAlert !== undefined && minStockAlert < 0) {
      return res.status(400).json({ success: false, message: 'Minimum stock alert level cannot be negative' });
    }

    // Handle stock changes and create movement log if necessary
    const updatedProduct = await prisma.$transaction(async (tx) => {
      const targetStock = currentStock !== undefined ? parseInt(currentStock, 10) : existingProduct.currentStock;
      const stockDiff = targetStock - existingProduct.currentStock;

      const product = await tx.product.update({
        where: { id: productId },
        data: {
          name,
          sku,
          category,
          unitPrice: unitPrice !== undefined ? parseFloat(unitPrice) : undefined,
          currentStock: targetStock,
          minStockAlert: minStockAlert !== undefined ? parseInt(minStockAlert, 10) : undefined,
          location,
        },
      });

      if (stockDiff !== 0) {
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            quantity: Math.abs(stockDiff),
            movementType: stockDiff > 0 ? MovementType.IN : MovementType.OUT,
            reason: reason || (stockDiff > 0 ? 'Manual inventory increase' : 'Manual inventory correction (decrease)'),
            createdBy: req.user!.id,
          },
        });
      }

      return product;
    });

    res.status(200).json({ success: true, message: 'Product updated successfully', data: updatedProduct });
  } catch (error) {
    next(error);
  }
});

export default router;
