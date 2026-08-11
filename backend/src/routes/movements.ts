import { Router } from 'express';
import prisma from '../config/db';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

// GET /movements - List stock movements with pagination
router.get('/', authenticateJWT, async (req, res, next) => {
  try {
    const { productId, page = '1', limit = '20' } = req.query;

    const pageNumber = parseInt(page as string, 10) || 1;
    const limitNumber = parseInt(limit as string, 10) || 20;
    const skip = (pageNumber - 1) * limitNumber;

    const whereClause: any = {};
    if (productId) {
      whereClause.productId = parseInt(productId as string, 10);
    }

    const [movements, total] = await prisma.$transaction([
      prisma.stockMovement.findMany({
        where: whereClause,
        include: {
          product: {
            select: { name: true, sku: true },
          },
          creator: {
            select: { username: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNumber,
      }),
      prisma.stockMovement.count({ where: whereClause }),
    ]);

    res.status(200).json({
      success: true,
      data: movements,
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

export default router;
