import { Router } from 'express';
import * as invoiceController from '../controllers/invoiceController.js';

const router = Router();

// POST /invoice
router.post('/', invoiceController.createInvoice);

export default router;
