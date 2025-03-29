import useRouter from 'express';
import {
  // GiveLoan,
  MakeLoanPayment,
  GetAllLoans,
  GetLoanById
} from '../../controller/LoanController.js';

const router = useRouter.Router();

// router.post('/create-loan', GiveLoan); // endpoint: /provide-loan/create-loan
router.post('/make-payment', MakeLoanPayment); // endpoint: /provide-loan/make-payment
router.get('/get-all-loans', GetAllLoans);  
// router.put('/update-role/:id', UpdateRole);  
// router.delete('/delete-role/:id', DeleteRole);  
router.get('/get-all-loans-by-id/:id', GetLoanById); 
// router.put('/update-role-status/:id', UpdateRoleStatus);  

export default router;
