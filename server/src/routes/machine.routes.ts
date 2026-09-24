import { Router } from 'express';
import { getMachineByCode, registerMachine } from '../controllers/machine.controller';

const router = Router();

router.get('/:machineCode', getMachineByCode);
router.post('/register', registerMachine);

export default router;
