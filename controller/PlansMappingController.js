import mongoose from 'mongoose';
import PlansMapping from '../models/plansMapping.model.js';
import Joi from 'joi';

// ════════════════════════════║  API TO Create Role   ║═════════════════════════════════//

export async function CreatePlans(req, res) {
  const ownerId = req.user._id;
  const { planMappingName, planId, amount, monthId } = req.body;
  try {
    const newPlans = new PlansMapping({
      planId,
      amount,
      monthId,
      planMappingName,
      createdById:ownerId,
    });

    await newPlans.save();

    return res.status(201).json({
      success: true,
      message: 'Created successfully.',
      newPlans
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// get all plans
// export async function getAllPlans(req, res) {
//   try {
//     //  join with tbl_plans_mstrs and tbl_month_mstrs
//     const plans = await PlansMapping.aggregate([
//       {
//         $lookup: {
//           from: 'tbl_plans_mstrs',
//           localField: 'planId',
//           foreignField: '_id',
//           as: 'plan'
//         }
//       },
//       {
//         $unwind: '$plan'
//       },
//       {
//         $lookup: {
//           from: 'tbl_month_mstrs',
//           localField: 'monthId',
//           foreignField: '_id',
//           as: 'month'
//         }
//       },
//       {
//         $unwind: '$month'
//       },
//       {
//         $project: {
//           _id: 1,
//           planMappingName: 1,
//           amount: 1,
//           status: 1,
//           monthId: 1,
//           planId: 1,
//           plan: '$plan.planName',
//           month: '$month.monthName',
//           createdAt: 1
//         }
//       }
//     ]);
//     return res.status(200).json({
//       success: true,
//       data: plans
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// }

export async function getAllPlans(req, res) {
  const ownerId = req.user._id;  
  const isOwner = req.user.roleId === '676e3938d0f5a92c824fc662'; 

  try {
    let query = [];

    if (isOwner) {
      query.push({
        $match: {
          createdById: new mongoose.Types.ObjectId(ownerId) 
        }
      });
    }

    query.push(
      {
        $lookup: {
          from: 'tbl_plans_mstrs',
          localField: 'planId',
          foreignField: '_id',
          as: 'plan'
        }
      },
      {
        $unwind: '$plan'
      },
      {
        $lookup: {
          from: 'tbl_month_mstrs',
          localField: 'monthId',
          foreignField: '_id',
          as: 'month'
        }
      },
      {
        $unwind: '$month'
      },
      {
        $project: {
          _id: 1,
          planMappingName: 1,
          amount: 1,
          status: 1,
          monthId: 1,
          planId: 1,
          plan: '$plan.planName',
          month: '$month.monthName',
          createdAt: 1
        }
      }
    );

    // Execute the aggregation pipeline (with or without owner filter)
    const plans = await PlansMapping.aggregate(query);

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
    const match = [
      {
        $match: {
          status: 1
        }
      }
    ];
    const plans = await PlansMapping.aggregate([
      ...match,
      {
        $lookup: {
          from: 'tbl_plans_mstrs',
          localField: 'planId',
          foreignField: '_id',
          as: 'plan'
        }
      },
      {
        $unwind: '$plan'
      },
      {
        $lookup: {
          from: 'tbl_month_mstrs',
          localField: 'monthId',
          foreignField: '_id',
          as: 'month'
        }
      },
      {
        $unwind: '$month'
      },
      {
        $project: {
          _id: 1,
          amount: 1,
          status: 1,
          monthId: 1,
          planId: 1,
          plan: '$plan.planName',
          month: '$month.monthName'
        }
      }
    ]);
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

// export async function getAllActivePlans(req, res) {
//   const ownerId = req.user._id; 
//   const isOwner = req.user.roleId === '676e3938d0f5a92c824fc662';  

//   try {
//     let match = [
//       {
//         $match: {
//           status: 1  
//         }
//       }
//     ];

//     if (isOwner) {
//       match.push({
//         $match: {
//           createdById: new mongoose.Types.ObjectId(ownerId) 
//         }
//       });
//     }

//     const plans = await PlansMapping.aggregate([
//       ...match,
//       {
//         $lookup: {
//           from: 'tbl_plans_mstrs',
//           localField: 'planId',
//           foreignField: '_id',
//           as: 'plan'
//         }
//       },
//       {
//         $unwind: '$plan'
//       },
//       {
//         $lookup: {
//           from: 'tbl_month_mstrs',
//           localField: 'monthId',
//           foreignField: '_id',
//           as: 'month'
//         }
//       },
//       {
//         $unwind: '$month'
//       },
//       {
//         $project: {
//           _id: 1,
//           amount: 1,
//           status: 1,
//           monthId: 1,
//           planId: 1,
//           plan: '$plan.planName',
//           month: '$month.monthName'
//         }
//       }
//     ]);

//     return res.status(200).json({
//       success: true,
//       data: plans
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// }


// get plan by id
export async function getPlanById(req, res) {
  const { id } = req.params;
  try {
    const plan = await PlansMapping.findById(id);
    if (!plan) {
      return res.status(200).json({
        success: false,
        message: 'Plan not found'
      });
    }
    return res.status(200).json({
      success: true,
      data: plan
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// update plan by id
export async function updatePlanById(req, res) {
  const { id } = req.params;
  const { planId, monthId, amount, planMappingName } = req.body;
  try {
    const plan = await PlansMapping.findByIdAndUpdate(
      id,
      { planId, amount, monthId, planMappingName },
      { new: true }
    );
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Plan updated successfully',
      data: plan
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// update plan status by id if status is 1 then it will be 0 and vice versa
export async function updatePlanStatusById(req, res) {
  const { id } = req.params;
  try {
    const plan = await PlansMapping.findById(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }
    plan.status = plan.status === 1 ? 0 : 1;
    await plan.save();
    return res.status(200).json({
      success: true,
      message: 'Plan status updated successfully',
      data: plan
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// delete plan by id
export async function deletePlanById(req, res) {
  const { id } = req.params;
  try {
    const plan = await PlansMapping.findByIdAndDelete(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Plan deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// get planMapping by monthId and planId
export async function getPlanMappingByMonthAndPlanId(req, res) {
  const { id } = req.query;
  try {
    const match = [
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id)
        }
      }
    ];
    const planMapping = await PlansMapping.aggregate([
      ...match,
      {
        $lookup: {
          from: 'tbl_plans_mstrs',
          localField: 'planId',
          foreignField: '_id',
          as: 'plan'
        }
      },
      {
        $unwind: '$plan'
      },
      {
        $lookup: {
          from: 'tbl_month_mstrs',
          localField: 'monthId',
          foreignField: '_id',
          as: 'month'
        }
      },
      {
        $unwind: '$month'
      },
      {
        $project: {
          _id: 1,
          amount: 1,
          status: 1,
          monthId: 1,
          planId: 1,
          plan: '$plan.planName',
          month: '$month.monthName'
        }
      }
    ]);
    if (!planMapping) {
      return res.status(404).json({
        success: false,
        message: 'Plan Mapping not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: planMapping[0]
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// export async function getAllPlanMappingActive(req, res) {
//   try {
//     const match = [
//       {
//         $match: {
//           status: 1
//         }
//       }
//     ];
//     const planMapping = await PlansMapping.aggregate([
//       ...match,
//       {
//         $lookup: {
//           from: 'tbl_plans_mstrs',
//           localField: 'planId',
//           foreignField: '_id',
//           as: 'plan'
//         }
//       },
//       {
//         $unwind: '$plan'
//       },
//       {
//         $lookup: {
//           from: 'tbl_month_mstrs',
//           localField: 'monthId',
//           foreignField: '_id',
//           as: 'month'
//         }
//       },
//       {
//         $unwind: '$month'
//       },
//       {
//         $project: {
//           _id: 1,
//           amount: 1,
//           status: 1,
//           monthId: 1,
//           planId: 1,
//           plan: '$plan.planName',
//           month: '$month.monthName'
//         }
//       }
//     ]);
//     if (!planMapping) {
//       return res.status(404).json({
//         success: false,
//         message: 'Plan Mapping not found'
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       data: planMapping
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// }

export async function getAllPlanMappingActive(req, res) {
  const ownerId = req.user._id;   
  const isOwner = req.user.roleId === '676e3938d0f5a92c824fc662';  

  try {
     
    const match = [
      {
        $match: {
          status: 1 
        }
      }
    ];

     
    if (isOwner) {
      match.push({
        $match: {
          createdById: new mongoose.Types.ObjectId(ownerId)  
        }
      });
    }

    const planMapping = await PlansMapping.aggregate([
      ...match,
      {
        $lookup: {
          from: 'tbl_plans_mstrs',
          localField: 'planId',
          foreignField: '_id',
          as: 'plan'
        }
      },
      {
        $unwind: '$plan'
      },
      {
        $lookup: {
          from: 'tbl_month_mstrs',
          localField: 'monthId',
          foreignField: '_id',
          as: 'month'
        }
      },
      {
        $unwind: '$month'
      },
      {
        $project: {
          _id: 1,
          amount: 1,
          status: 1,
          monthId: 1,
          planId: 1,
          plan: '$plan.planName',
          month: '$month.monthName'
        }
      }
    ]);

    if (!planMapping || planMapping.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active plan mappings found'
      });
    }

    return res.status(200).json({
      success: true,
      data: planMapping
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
