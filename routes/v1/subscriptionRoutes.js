import useRouter from 'express';
import {
  createNewSubscription,
  getDueSubscription,
  updateSubscription,
  getAllReceipts,
  updateSubscriptionById,
  getReceiptById,
  deleteSubscriptionById,
  updateExpiredSubscription,
  dumpExpiredSubscription,
  getAllExpiredSubscriptions,
  updateExpiredSubscriptionStatus,
  updateExpInStatusById
} from '../../controller/SubscriptionController.js';

const router = useRouter.Router();
router.post('/create-new-subscription', createNewSubscription);
router.get('/get-due-subscription/:id', getDueSubscription);
router.put('/update-subscription', updateSubscription);
router.get('/get-all-receipts', getAllReceipts);
router.put('/update-subscription/:id', updateSubscriptionById);
router.get('/get-receipt/:id', getReceiptById);
router.post('/delete-subscription', deleteSubscriptionById);
router.put('/update-expired-subscription', updateExpiredSubscription);
router.post('/dump-expired-subscription', dumpExpiredSubscription);
router.get('/get-all-expired-subscriptions', getAllExpiredSubscriptions);
router.put(
  '/update-expired-subscription-status',
  updateExpiredSubscriptionStatus
);
router.put('/update-exp-in-status/:id', updateExpInStatusById);

export default router;
