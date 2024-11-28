import PlanMaster from '../models/planMaster.model.js';
import MonthMaster from '../models/monthMaster.model.js';
import Joi from 'joi';

// crete plan master
export async function CreatePlanMaster(req, res) {
  const { planName } = req.body;
  try {
    const schema = Joi.object({
      planName: Joi.string()
        .required()
        .min(1)
        .max(50)
        .label('planName is not more than 50 characters')
    });
    const newPlan = new PlanMaster({
      planName
    });
    const { error } = schema.validate(req.body);
    if (error) {
      return res
        .status(200)
        .json({ message: error.details[0].message, success: false });
    }
    await newPlan.save();

    return res.status(201).json({
      success: true,
      message: 'Created successfully.',
      newPlan
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// get all plans
export async function getAllPlans(req, res) {
  try {
    const plans = await PlanMaster.find();
    return res.status(200).json({
      success: true,
      data: plans
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// get all active plans
export async function getAllActivePlans(req, res) {
  try {
    const plans = await PlanMaster.find({ status: 1 });
    return res.status(200).json({
      success: true,
      data: plans
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// get plan by id
export async function getPlanById(req, res) {
  const { id } = req.params;
  try {
    const plan = await PlanMaster.findById(id);
    if (!plan) {
      return res
        .status(404)
        .json({ success: false, message: 'Plan not found' });
    }
    return res.status(200).json({ success: true, data: plan });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// update plan by id
export async function updatePlanById(req, res) {
  const { id } = req.params;
  const { planName } = req.body;
  try {
    const plan = await PlanMaster.findById(id);
    if (!plan) {
      return res
        .status(404)
        .json({ success: false, message: 'Plan not found' });
    }
    const schema = Joi.object({
      planName: Joi.string()
        .required()
        .min(1)
        .max(50)
        .label('planName is not more than 50 characters')
    });
    const { error } = schema.validate(req.body);
    if (error) {
      return res
        .status(200)
        .json({ message: error.details[0].message, success: false });
    }
    const updatedPlan = await PlanMaster.findByIdAndUpdate(
      id,
      { planName },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      data: updatedPlan,
      message: 'Updated successfully.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// update status if status=0 then status=1 and vice versa
export async function updatePlanStatusById(req, res) {
  const { id } = req.params;
  try {
    const plan = await PlanMaster.findById(id);
    if (!plan) {
      return res
        .status(404)
        .json({ success: false, message: 'Plan not found' });
    }
    const updatedPlan = await PlanMaster.findByIdAndUpdate(
      id,
      { status: plan.status === 1 ? 0 : 1 },
      { new: true }
    );
    return res.status(200).json({ success: true, data: updatedPlan });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// delete plan by id
export async function deletePlanById(req, res) {
  const { id } = req.params;
  try {
    const plan = await PlanMaster.findById(id);
    if (!plan) {
      return res
        .status(404)
        .json({ success: false, message: 'Plan not found' });
    }
    await plan.remove();
    return res
      .status(200)
      .json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ============================ Month Master ============================
// crete month master
export async function CreateMonthMaster(req, res) {
  const { monthName } = req.body;
  try {
    const monthCheck = await MonthMaster.findOne({ monthName });
    if (monthCheck) {
      return res.status(200).json({
        success: false,
        message: 'Month already exists'
      });
    }

    const newMonth = new MonthMaster({
      monthName
    });

    await newMonth.save();

    return res.status(201).json({
      success: true,
      message: 'Created successfully.',
      newMonth
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// get all months
export async function getAllMonths(req, res) {
  try {
    const months = await MonthMaster.find();
    return res.status(200).json({
      success: true,
      data: months
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// get all active months
export async function getAllActiveMonths(req, res) {
  try {
    const months = await MonthMaster.find({ status: 1 });
    return res.status(200).json({
      success: true,
      data: months
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// get month by id
export async function getMonthById(req, res) {
  const { id } = req.params;
  try {
    const month = await MonthMaster.findById(id);
    if (!month) {
      return res
        .status(404)
        .json({ success: false, message: 'Month not found' });
    }
    return res.status(200).json({ success: true, data: month });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// update month by id
export async function updateMonthById(req, res) {
  const { id } = req.params;
  const { monthName } = req.body;
  try {
    const month = await MonthMaster.findById(id);
    if (!month) {
      return res
        .status(404)
        .json({ success: false, message: 'Month not found' });
    }

    const updatedMonth = await MonthMaster.findByIdAndUpdate(
      id,
      { monthName },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      data: updatedMonth,
      message: 'Updated successfully.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// update status if status=0 then status=1 and vice versa
export async function updateMonthStatusById(req, res) {
  const { id } = req.params;
  try {
    const month = await MonthMaster.findById(id);
    if (!month) {
      return res
        .status(404)
        .json({ success: false, message: 'Month not found' });
    }
    const updatedMonth = await MonthMaster.findByIdAndUpdate(
      id,
      { status: month.status === 1 ? 0 : 1 },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      data: updatedMonth,
      message:
        updatedMonth.status === 1 ? 'Month activated' : 'Month deactivated'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// delete month by id
export async function deleteMonthById(req, res) {
  const { id } = req.params;
  try {
    const month = await MonthMaster.findById(id);
    if (!month) {
      return res
        .status(404)
        .json({ success: false, message: 'Month not found' });
    }
    await month.remove();
    return res
      .status(200)
      .json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
