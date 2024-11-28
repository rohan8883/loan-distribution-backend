import useRouter from 'express';
import {
  CreateMonthMaster,
  CreatePlanMaster,
  deleteMonthById,
  deletePlanById,
  getAllActiveMonths,
  getAllActivePlans,
  getAllMonths,
  getAllPlans,
  getMonthById,
  getPlanById,
  updateMonthById,
  updatePlanById,
  updatePlanStatusById,
  updateMonthStatusById
} from '../../controller/MastersController.js';

const router = useRouter.Router();

// plan routes
router.post('/create-plan', CreatePlanMaster); // endpoint: /masters/create-plan, body{}
router.get('/get-all-plans', getAllPlans); // endpoint: /masters/get-all-plans
router.get('/get-all-active-plans', getAllActivePlans); // endpoint: /masters/get-all-active-plans
router.get('/get-plan/:id', getPlanById); // endpoint: /masters/get-plan/:id
router.put('/update-plan/:id', updatePlanById); // endpoint: /masters/update-plan/:id, body{}
router.put('/update-plan-status/:id', updatePlanStatusById); // endpoint: /masters/update-plan-status/:id, body{}
router.delete('/delete-plan/:id', deletePlanById); // endpoint: /masters/delete-plan/:id

// month routes
router.post('/create-month', CreateMonthMaster); // endpoint: /masters/create-month, body{}
router.get('/get-all-months', getAllMonths); // endpoint: /masters/get-all-months
router.get('/get-all-active-months', getAllActiveMonths); // endpoint: /masters/get-all-active-months
router.get('/get-month/:id', getMonthById); // endpoint: /masters/get-month/:id
router.put('/update-month/:id', updateMonthById); // endpoint: /masters/update-month/:id, body{}
router.put('/update-month-status/:id', updateMonthStatusById); // endpoint: /masters/update-month-status/:id, body{}
router.delete('/delete-month/:id', deleteMonthById); // endpoint: /masters/delete-month/:id

export default router;
