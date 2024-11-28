import useRouter from 'express';
import {
  getCountReport,
  getExpiredSubsBeforeSevenDay,
  getPlanExpiryReport,
  getSubscriptionExpiredReport,
  amountList,
  getExpiredSubs,
  collectionReport,
  monthWisePlanWiseReport,
  getAllExpiredSubsList
} from '../../controller/ReportController.js';

const router = useRouter.Router();

router.get('/get-count-report', getCountReport);
router.get('/get-expired-subs-before-seven-day', getExpiredSubsBeforeSevenDay);
router.get('/get-plan-expiry-report', getPlanExpiryReport);
router.get('/get-subscription-expired-report', getSubscriptionExpiredReport);
router.get('/amount-list', amountList);
router.get('/get-expired-subs', getExpiredSubs);
router.get('/collection-report', collectionReport);
router.get('/month-wise-plan-wise-report', monthWisePlanWiseReport);
router.get('/get-all-expired-subs-list', getAllExpiredSubsList);

export default router;
