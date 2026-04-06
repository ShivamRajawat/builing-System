import { Router } from 'express';
import * as invoiceController from '../controllers/invoiceController.js';

const router = Router();

router.get('/', invoiceController.listInvoices);
router.get('/:id', invoiceController.getInvoiceById);

export default router;
