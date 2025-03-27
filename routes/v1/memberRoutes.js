import useRouter from 'express';
import {
  createOwnerNew,
  getAllOwners,
  getOwnerById,
  updateOwnerById,
  updateOwnerStatusById,

  createMemberNew,
  getAllMembers,
  getMemberById,
  updateMemberById,
  updateMemberStatusById,
  
} from '../../controller/MemberController.js';

const router = useRouter.Router();

router.post('/create-owner', createOwnerNew);
router.get('/get-owners', getAllOwners);
router.get('/get-owner-by-id/:id', getOwnerById);
router.put('/update-owner/:id', updateOwnerById);
router.put('/update-owner-status/:id', updateOwnerStatusById);

router.post('/create-member', createMemberNew);
router.get('/get-members', getAllMembers);
router.get('/get-member/:id', getMemberById);
router.put('/update-member/:id', updateMemberById);
router.put('/update-member-status/:id', updateMemberStatusById);

export default router;
