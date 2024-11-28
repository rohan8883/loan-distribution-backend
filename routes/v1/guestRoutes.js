import useRouter from 'express';
import { getReceiptById } from '../../controller/SubscriptionController.js';
import { getMemberById } from '../../controller/MemberController.js';

const router = useRouter.Router();
router.get('/get-receipt/:id', getReceiptById);
router.get('/get-member/:id', getMemberById);

export default router;
