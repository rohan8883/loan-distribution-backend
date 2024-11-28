import useRouter from 'express';
import {
  createMemberNew,
  getAllMembers,
  getMemberById,
  updateMemberById,
  updateMemberStatusById
} from '../../controller/MemberController.js';

const router = useRouter.Router();

router.post('/create-member', createMemberNew);
router.get('/get-members', getAllMembers);
router.get('/get-member/:id', getMemberById);
router.put('/update-member/:id', updateMemberById);
router.put('/update-member-status/:id', updateMemberStatusById);

export default router;
