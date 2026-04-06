import { Router } from 'express';
import * as customerController from '../controllers/customerController.js';

const router = Router();

router.post('/', customerController.createCustomer);
router.get('/', customerController.listCustomers);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);

export default router;
