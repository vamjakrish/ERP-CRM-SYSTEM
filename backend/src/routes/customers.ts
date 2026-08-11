import { Router } from 'express';
import prisma from '../config/db';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { CustomerType, CustomerStatus } from '@prisma/client';

const router = Router();

// GET /customers - Search and list with pagination
router.get('/', authenticateJWT, async (req, res, next) => {
  try {
    const { search, page = '1', limit = '10', type, status } = req.query;

    const pageNumber = parseInt(page as string, 10) || 1;
    const limitNumber = parseInt(limit as string, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { businessName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { mobile: { contains: search as string } },
      ];
    }

    if (type) {
      whereClause.customerType = type as CustomerType;
    }

    if (status) {
      whereClause.status = status as CustomerStatus;
    }

    const [customers, total] = await prisma.$transaction([
      prisma.customer.findMany({
        where: whereClause,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limitNumber,
      }),
      prisma.customer.count({ where: whereClause }),
    ]);

    res.status(200).json({
      success: true,
      data: customers,
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

// GET /customers/:id - Detailed view including follow-up notes
router.get('/:id', authenticateJWT, async (req, res, next) => {
  try {
    const customerId = parseInt(req.params.id, 10);
    if (isNaN(customerId)) {
      return res.status(400).json({ success: false, message: 'Invalid customer ID' });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        followUps: {
          include: {
            creator: {
              select: { username: true, role: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
});

// POST /customers - Add customer (ADMIN, SALES only)
router.post('/', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), async (req, res, next) => {
  try {
    const { name, mobile, email, businessName, gstNumber, customerType, address, status, followUpDate, notes } = req.body;

    // Validation
    if (!name || !mobile || !email || !businessName || !customerType || !address || !status) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    if (!Object.values(CustomerType).includes(customerType)) {
      return res.status(400).json({ success: false, message: 'Invalid customer type' });
    }

    if (!Object.values(CustomerStatus).includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid customer status' });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        mobile,
        email,
        businessName,
        gstNumber,
        customerType: customerType as CustomerType,
        address,
        status: status as CustomerStatus,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        notes,
      },
    });

    res.status(201).json({ success: true, message: 'Customer created successfully', data: customer });
  } catch (error) {
    next(error);
  }
});

// PUT /customers/:id - Edit customer (ADMIN, SALES only)
router.put('/:id', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), async (req, res, next) => {
  try {
    const customerId = parseInt(req.params.id, 10);
    if (isNaN(customerId)) {
      return res.status(400).json({ success: false, message: 'Invalid customer ID' });
    }

    const { name, mobile, email, businessName, gstNumber, customerType, address, status, followUpDate, notes } = req.body;

    // Check customer exists
    const existing = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Validation if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    if (customerType && !Object.values(CustomerType).includes(customerType)) {
      return res.status(400).json({ success: false, message: 'Invalid customer type' });
    }

    if (status && !Object.values(CustomerStatus).includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid customer status' });
    }

    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        name,
        mobile,
        email,
        businessName,
        gstNumber,
        customerType: customerType ? (customerType as CustomerType) : undefined,
        address,
        status: status ? (status as CustomerStatus) : undefined,
        followUpDate: followUpDate !== undefined ? (followUpDate ? new Date(followUpDate) : null) : undefined,
        notes,
      },
    });

    res.status(200).json({ success: true, message: 'Customer updated successfully', data: customer });
  } catch (error) {
    next(error);
  }
});

// POST /customers/:id/followups - Add follow-up notes (ADMIN, SALES only)
router.post('/:id/followups', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const customerId = parseInt(req.params.id, 10);
    if (isNaN(customerId)) {
      return res.status(400).json({ success: false, message: 'Invalid customer ID' });
    }

    const { note } = req.body;
    if (!note || note.trim() === '') {
      return res.status(400).json({ success: false, message: 'Note content is required' });
    }

    // Check customer exists
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const followUp = await prisma.customerFollowUp.create({
      data: {
        customerId,
        note,
        createdBy: req.user!.id,
      },
      include: {
        creator: {
          select: { username: true, role: true },
        },
      },
    });

    res.status(201).json({ success: true, message: 'Follow-up note added', data: followUp });
  } catch (error) {
    next(error);
  }
});

export default router;
