import rootRouter from 'express';
import {
  authMiddleWare,
} from '../../middleware/_middleware.js';
import authRoutes from './AuthRoutes.js';
import usersRoutes from './UsersRoutes.js';
import roleRoutes from './RoleRoutes.js';
import plansRoutes from './PlansRoutes.js';
import otp from './Otp/OtpRoute.js';
import memberRoutes from './memberRoutes.js';
import subscriptionRoutes from './subscriptionRoutes.js';
import masterRoutes from './mastersRoutes.js';
import reportRoutes from './report.js';
import guestRoutes from './guestRoutes.js';
import changePassword from './ChangepasswordRoute.js'
import provideLoan from './LoanRoutes.js'

const router = rootRouter.Router({ mergeParams: true });

router.use('/auth', authRoutes);
router.use('/otp', otp);
router.use('/guest', guestRoutes);
router.use('/guest-member', memberRoutes);
// ════════════════════════════║  middleware to protect all routes   ║═════════════════════════════════
router.use(authMiddleWare); // protect all routes
// router.use(authCookieMiddleware); // protect all routes
router.use('/user', usersRoutes);
router.use('/role-d', roleRoutes);
router.use('/member', memberRoutes);
router.use('/role', roleRoutes);
router.use('/plans', plansRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/masters', masterRoutes);
router.use('/report', reportRoutes);
router.use('/change-pass', changePassword);
router.use('/provide-loan', provideLoan);

export default router;
