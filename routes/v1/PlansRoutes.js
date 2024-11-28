import useRouter from 'express';
import {
  CreatePlans,
  getAllPlans,
  getPlanById,
  updatePlanById,
  getAllActivePlans,
  updatePlanStatusById,
  deletePlanById,
  getPlanMappingByMonthAndPlanId,
  getAllPlanMappingActive
} from '../../controller/PlansMappingController.js';

const router = useRouter.Router();

router.post('/create-plans', CreatePlans); // endpoint: /plans/create-plans, body{}
router.get('/get-all-plans', getAllPlans); // endpoint: /plans/get-all-plans
router.get('/get-all-active-plans', getAllActivePlans); // endpoint: /plans/get-all-active-plans
router.get('/get-plan/:id', getPlanById); // endpoint: /plans/get-plan/:id
router.put('/update-plan/:id', updatePlanById); // endpoint: /plans/update-plan/:id, body{}
router.put('/update-plan-status/:id', updatePlanStatusById); // endpoint: /plans/update-plan-status/:id, body{}
router.delete('/delete-plan/:id', deletePlanById); // endpoint: /plans/delete-plan/:id
router.get('/get-plan-mapping-by-id', getPlanMappingByMonthAndPlanId); // endpoint: /plans/get-plan-mapping/:monthId/:planId
router.get('/get-all-active-plan-mapping', getAllPlanMappingActive); // endpoint: /plans/get-all-active-plan-mapping

export default router;
