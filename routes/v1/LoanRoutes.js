import useRouter from 'express';
import {
  GiveLoan,
  GetAllLoans,
  GetLoanById
} from '../../controller/LoanController.js';

const router = useRouter.Router();

router.post('/create-loan', GiveLoan); // endpoint: /provide-loan/create-loan
router.get('/get-all-loans', GetAllLoans);  
// router.put('/update-role/:id', UpdateRole);  
// router.delete('/delete-role/:id', DeleteRole);  
router.post('/get-all-loans-by-id/:id', GetLoanById); 
// router.put('/update-role-status/:id', UpdateRoleStatus);  

export default router;
