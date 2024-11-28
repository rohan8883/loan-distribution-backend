import Subscription from '../models/subscriptions.model.js';
import PlanMapping from '../models/plansMapping.model.js';
import Receipt from '../models/receipt.model.js';
import Member from '../models/members.modal.js';
import MonthMaster from '../models/monthMaster.model.js';
import PlanMaster from '../models/planMaster.model.js';
import ExpiredSub from '../models/expiredSub.js';
import mongoose from 'mongoose';

export const getCountReport = async (req, res) => {
  try {
    const [
      activeMember,
      inActiveMember,
      totalAmount,
      expiredSub,
      expiredSubsBeforeSevenDay,
      expSubscriptionCount
    ] = await Promise.all([
      Member.aggregate([
        {
          $match: {
            status: 1
          }
        },
        {
          $count: 'activeMember'
        }
      ]),
      Member.aggregate([
        {
          $match: {
            status: 0
          }
        },
        {
          $count: 'inActiveMember'
        }
      ]),

      Subscription.aggregate([
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            totalPaidAmount: { $sum: '$paidAmount' },
            totalDueAmount: { $sum: '$dueAmount' }
          }
        }
      ]),
      Subscription.aggregate([
        {
          $lookup: {
            from: 'tbl_members',
            localField: 'memberId',
            foreignField: '_id',
            as: 'member',
            pipeline: [
              {
                $match: {
                  status: 1
                }
              }
            ]
          }
        },
        {
          $unwind: '$member'
        },
        {
          $match: {
            endDate: {
              $lt: new Date(new Date().setDate(new Date().getDate() + 10))
            },
            expInStatus: 1
          }
        },
        {
          $count: 'expiredSub'
        }
      ]),
      Subscription.aggregate([
        {
          $match: {
            endDate: {
              $lt: new Date(new Date().setDate(new Date().getDate() + 10))
            }
          }
        },
        {
          $count: 'expiredSubsBeforeSevenDay'
        }
      ]),
      ExpiredSub.aggregate([
        {
          $match: {
            status: 1
          }
        },
        {
          $count: 'expSubscriptionCount'
        }
      ])
    ]);
    res.status(200).json({
      success: true,
      message: 'Counts fetched successfully',
      data: {
        totalMember:
          activeMember[0]?.activeMember + inActiveMember[0]?.inActiveMember,
        activeMember: activeMember[0]?.activeMember,
        inActiveMember: inActiveMember[0]?.inActiveMember || 0,
        totalAmount: totalAmount[0]?.totalAmount,
        totalPaidAmount: totalAmount[0]?.totalPaidAmount,
        totalUnpaidAmount:
          totalAmount[0]?.totalAmount -
            totalAmount[0]?.totalPaidAmount -
            totalAmount[0]?.totalDueAmount || 0,
        totalDueAmount: totalAmount[0]?.totalDueAmount || 0,
        expiredSub: expiredSub[0]?.expiredSub || 0,
        expiredSubsBeforeSevenDay:
          expiredSubsBeforeSevenDay[0]?.expiredSubsBeforeSevenDay || 0,
        expSubscriptionCount: expSubscriptionCount[0]?.expSubscriptionCount || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// expired subscriptions before 7 days list with Member details
export const getExpiredSubsBeforeSevenDay = async (req, res) => {
  try {
    const expiredSubsBeforeSevenDay = await Subscription.aggregate([
      {
        $lookup: {
          from: 'tbl_members',
          localField: 'memberId',
          foreignField: '_id',
          as: 'member',
          pipeline: [
            {
              $match: {
                status: 1
              }
            }
          ]
        }
      },
      {
        $unwind: '$member'
      },
      {
        $sort: {
          endDate: 1
        }
      },
      {
        $match: {
          endDate: {
            $lt: new Date(new Date().setDate(new Date().getDate() + 10))
          },
          expInStatus: 1
        }
      },
      {
        $project: {
          member: 1,
          amount: 1,
          paidAmount: 1,
          dueAmount: 1,
          startDate: 1,
          endDate: 1,
          expInStatus: 1,
          paidStatus: 1,
          planName: 1,
          month: 1
        }
      }
    ]);
    res.status(200).json({
      success: true,
      message: 'Expired subscriptions before 7 days fetched successfully',
      data: expiredSubsBeforeSevenDay
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getAllExpiredSubsList = async (req, res) => {
  const { page = 1, limit = 10, q } = req.query;
  const options = { page, limit };
  let query = [
    {
      $sort: {
        endDate: 1
      }
    },
    {
      $project: {
        __v: 0
      }
    }
  ];

  // if (q) {
  //   query.push({
  //     $match: {
  //       $or: [
  //         {
  //           memberName: {
  //             $regex: q || '',
  //             $options: 'i'
  //           }
  //         },
  //         {
  //           generatedId: {
  //             $regex: q || '',
  //             $options: 'i'
  //           }
  //         },
  //         {
  //           mobile: {
  //             $regex: q || '',
  //             $options: 'i'
  //           }
  //         }
  //       ]
  //     }
  //   });
  // }

  try {
    const expiredList = Subscription.aggregate([
      {
        $lookup: {
          from: 'tbl_members',
          localField: 'memberId',
          foreignField: '_id',
          as: 'member',
          pipeline: [
            {
              $match: {
                status: 1,
                $or: [
                  {
                    memberName: {
                      $regex: q || '',
                      $options: 'i'
                    }
                  },
                  {
                    generatedId: {
                      $regex: q || '',
                      $options: 'i'
                    }
                  },
                  {
                    mobile: {
                      $regex: q || '',
                      $options: 'i'
                    }
                  }
                ]
              }
            }
          ]
        }
      },
      {
        $unwind: '$member'
      },
      ...query,
      {
        $match: {
          endDate: {
            $lt: new Date(new Date().setDate(new Date().getDate() + 10))
          },
          expInStatus: 1
        }
      },
      {
        $project: {
          member: 1,
          amount: 1,
          paidAmount: 1,
          dueAmount: 1,
          startDate: 1,
          endDate: 1,
          expInStatus: 1,
          paidStatus: 1,
          planName: 1,
          month: 1
        }
      }
    ]);

    const PaginateExpiredList = await Subscription.aggregatePaginate(
      expiredList,
      options
    );

    res.status(200).json({
      success: true,
      message: 'Expired subscriptions fetched successfully',
      data: PaginateExpiredList
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// get subscription expired list with Member details
export const getExpiredSubs = async (req, res) => {
  const { page = 1, limit = 10, q } = req.query;
  const options = { page, limit };

  let query = [
    {
      $sort: {
        endDate: -1
      }
    },
    {
      $project: {
        __v: 0
      }
    }
  ];

  try {
    const expiredSubs = Subscription.aggregate([
      ...query,
      {
        $match: {
          endDate: { $lt: new Date() }
        }
      },
      {
        $lookup: {
          from: 'tbl_members',
          localField: 'memberId',
          foreignField: '_id',
          as: 'member',
          pipeline: [
            {
              $match: {
                $or: [
                  {
                    memberName: {
                      $regex: q || '',
                      $options: 'i'
                    }
                  },
                  {
                    generatedId: {
                      $regex: q || '',
                      $options: 'i'
                    }
                  },
                  {
                    mobile: {
                      $regex: q || '',
                      $options: 'i'
                    }
                  }
                ]
              }
            },
            {
              $lookup: {
                from: 'tbl_plans_mappings',
                localField: 'planMappingId',
                foreignField: '_id',
                as: 'planMapping',
                pipeline: [
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
                    $project: {
                      planName: '$plan.planName',
                      amount: 1
                    }
                  }
                ]
              }
            },
            {
              $unwind: '$planMapping'
            },
            {
              $project: {
                memberName: 1,
                mobile: 1,
                email: 1,
                dob: 1,
                address: 1,
                fullImgUrl: 1,
                imageUrl: 1,
                generatedId: 1,
                planName: '$planMapping.planName'
              }
            }
          ]
        }
      },
      {
        $unwind: '$member'
      },
      {
        $project: {
          member: 1,
          amount: 1,
          paidAmount: 1,
          dueAmount: 1,
          startDate: 1,
          endDate: 1
        }
      }
    ]);

    const aggregatePaginate = await Subscription.aggregatePaginate(
      expiredSubs,
      options
    );

    res.status(200).json({
      success: true,
      message: 'Expired subscriptions fetched successfully',
      data: aggregatePaginate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// plan expiry report
export const getPlanExpiryReport = async (req, res) => {
  try {
    const planExpiryReport = await PlanMapping.aggregate([
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
        $lookup: {
          from: 'tbl_members',
          localField: '_id',
          foreignField: 'planMappingId',
          as: 'member'
        }
      },
      {
        $unwind: '$member'
      },
      {
        $project: {
          planName: '$plan.planName',
          month: '$month.month',
          amount: 1,
          memberName: '$member.memberName',
          mobile: '$member.mobile',
          email: '$member.email',
          dob: '$member.dob',
          address: '$member.address'
        }
      }
    ]);
    res.status(200).json({
      success: true,
      message: 'Plan expiry report fetched successfully',
      data: planExpiryReport
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// subscription expired report with Member details
export const getSubscriptionExpiredReport = async (req, res) => {
  try {
    const subscriptionExpiredReport = await Subscription.aggregate([
      {
        $match: {
          endDate: { $lt: new Date() }
        }
      },
      {
        $lookup: {
          from: 'tbl_members',
          localField: 'memberId',
          foreignField: '_id',
          as: 'member',
          pipeline: [
            {
              $lookup: {
                from: 'tbl_plans_mappings',
                localField: 'planMappingId',
                foreignField: '_id',
                as: 'planMapping',
                pipeline: [
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
                    $project: {
                      planName: '$plan.planName',
                      amount: 1
                    }
                  }
                ]
              }
            },
            {
              $unwind: '$planMapping'
            },
            {
              $project: {
                memberName: 1,
                mobile: 1,
                email: 1,
                dob: 1,
                address: 1,
                planName: '$planMapping.planName'
              }
            }
          ]
        }
      },
      {
        $unwind: '$member'
      },
      {
        $project: {
          member: 1,
          amount: 1,
          paidAmount: 1,
          dueAmount: 1,
          startDate: 1,
          endDate: 1
        }
      }
    ]);
    res.status(200).json({
      success: true,
      message: 'Subscription expired report fetched successfully',
      data: subscriptionExpiredReport
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// get due amount, due, paid, list with Member details and plan details? paid using paidStatus?
export const amountList = async (req, res) => {
  const { page = 1, limit = 10, paidstatus } = req.query;
  const options = { page, limit };

  let query = [
    {
      $sort: {
        createdAt: -1
      }
    },
    {
      $project: {
        __v: 0
      }
    }
  ];

  if (paidstatus == '0') {
    query.push({
      $match: {
        $expr: {
          $gt: [{ $subtract: ['$amount', '$paidAmount'] }, 0]
        },
        paidStatus: 0
      }
    });
  }

  if (paidstatus == '1') {
    query.push({
      $match: {
        paidAmount: { $gt: 0 },
        paidStatus: 1
      }
    });
  }

  if (paidstatus == '2') {
    query.push({
      $match: {
        dueAmount: { $gt: 0 },
        paidStatus: 2
      }
    });
  }

  const pipeline = [
    ...query,
    {
      $group: {
        _id: '$memberId',
        amount: { $sum: { $ifNull: ['$amount', 0] } },
        paidAmount: { $sum: { $ifNull: ['$paidAmount', 0] } },
        dueAmount: { $sum: { $ifNull: ['$dueAmount', 0] } },
        unpaidAmount: { $sum: { $ifNull: ['$unpaidAmount', 0] } },
        firstSubscription: { $first: '$$ROOT' }
      }
    },
    {
      $lookup: {
        from: 'tbl_members',
        localField: '_id', // Use memberId from the grouped result
        foreignField: '_id',
        as: 'member'
      }
    },
    {
      $unwind: '$member'
    },
    {
      $lookup: {
        from: 'tbl_plans_mappings',
        localField: 'firstSubscription.planMappingId',
        foreignField: '_id',
        as: 'planMapping'
      }
    },
    {
      $unwind: {
        path: '$planMapping',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: 'tbl_plans_mstrs',
        localField: 'planMapping.planId',
        foreignField: '_id',
        as: 'plan'
      }
    },
    {
      $unwind: {
        path: '$plan',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        member: {
          _id: '$member._id',
          planName: '$plan.planName',
          memberName: '$member.memberName',
          mobile: '$member.mobile',
          email: '$member.email',
          dob: '$member.dob',
          address: '$member.address'
        },
        amount: 1,
        paidAmount: 1,
        dueAmount: 1,
        startDate: '$firstSubscription.startDate',
        endDate: '$firstSubscription.endDate'
      }
    }
  ];

  try {
    const amountList = Subscription.aggregate(pipeline);
    const aggregatePaginate = await Subscription.aggregatePaginate(
      amountList,
      options
    );

    // total paid total amount sum and total due amount sum and total paid amount sum using javascript reduce method?
    const totalAmountData = await Subscription.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalPaidAmount: { $sum: '$paidAmount' },
          totalDueAmount: { $sum: '$dueAmount' },

          totalUnpaidAmount: {
            $sum: {
              $subtract: ['$amount', { $add: ['$paidAmount', '$dueAmount'] }]
            }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      message: 'Amount list fetched successfully',
      data: {
        ...aggregatePaginate,
        totalAmt: totalAmountData[0]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// collection report with group by member and plan details and total amount, paid amount, due amount and unpaid amount with Member details and plan details and paid using paidStatus and group by memberId using from and to date
export const collectionReport = async (req, res) => {
  const { page = 1, limit = 1, fromDate, toDate } = req.query;
  const options = { page, limit };

  let query = [
    {
      $sort: {
        createdAt: -1
      }
    },
    {
      $project: {
        __v: 0
      }
    }
  ];

  if (fromDate && toDate) {
    query.push({
      $match: {
        createdAt: {
          $gte: new Date(fromDate),
          $lte: new Date(toDate)
        }
      }
    });
  }

  const collectionAmount = await Subscription.aggregate([
    {
      $match: {
        ...query[1].$match
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalPaidAmount: { $sum: '$paidAmount' },
        totalDueAmount: { $sum: '$dueAmount' }
      }
    }
  ]);

  const pipeline = [
    ...query,
    {
      $match: {
        paidAmount: { $gt: 0 }
      }
    },
    {
      $group: {
        _id: '$memberId',
        amount: { $sum: { $ifNull: ['$amount', 0] } },
        paidAmount: { $sum: { $ifNull: ['$paidAmount', 0] } },
        dueAmount: { $sum: { $ifNull: ['$dueAmount', 0] } },
        firstSubscription: { $first: '$$ROOT' }
      }
    },
    {
      $lookup: {
        from: 'tbl_members',
        localField: '_id', // Use memberId from the grouped result
        foreignField: '_id',
        as: 'member'
      }
    },
    {
      $unwind: '$member'
    },
    {
      $lookup: {
        from: 'tbl_plans_mappings',
        localField: 'firstSubscription.planMappingId',
        foreignField: '_id',
        as: 'planMapping'
      }
    },
    {
      $unwind: {
        path: '$planMapping',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: 'tbl_plans_mstrs',
        localField: 'planMapping.planId',
        foreignField: '_id',
        as: 'plan'
      }
    },
    {
      $unwind: {
        path: '$plan',
        preserveNullAndEmptyArrays: true
      }
    },

    {
      $project: {
        member: {
          _id: '$member._id',
          planName: '$plan.planName',
          memberName: '$member.memberName',
          mobile: '$member.mobile',
          email: '$member.email',
          dob: '$member.dob',
          address: '$member.address',
          generatedId: '$member.generatedId'
        },
        amount: 1,
        paidAmount: 1,
        dueAmount: 1,
        startDate: '$firstSubscription.startDate',
        endDate: '$firstSubscription.endDate',
        paidStatus: '$firstSubscription.paidStatus',
        // total paid total amount sum and total due amount sum and total paid amount sum using javascript reduce method?
        totalAmount: {
          $sum: '$amount'
        },
        totalPaidAmount: {
          $sum: '$paidAmount'
        },
        totalDueAmount: {
          $sum: '$dueAmount'
        }
      }
    }
  ];

  try {
    const collectionReport = Subscription.aggregate(pipeline);
    const aggregatePaginate = await Subscription.aggregatePaginate(
      collectionReport,
      options
    );

    res.status(200).json({
      success: true,
      message: 'Collection report fetched successfully',
      data: {
        ...aggregatePaginate,
        actualAmount: collectionAmount[0]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// monthwise and planwise and paid or unpaid data member, subscription, plan, month, amount, paid amount, due amount, paid status, expiry status, member details, plan details, month details, paid using paidStatus and group by monthId and planId and paidStatus
export const monthWisePlanWiseReport = async (req, res) => {
  const { page = 1, limit = 10, paidstatus, monthId, planId, q } = req.query;
  const options = { page, limit };

  let query = [
    {
      $sort: {
        createdAt: -1
      }
    },
    {
      $project: {
        __v: 0
      }
    }
  ];

  if (monthId && !planId) {
    query.push({
      $match: {
        monthId: new mongoose.Types.ObjectId(monthId)
      }
    });
  }

  if (planId && !monthId) {
    query.push({
      $match: {
        monthId: new mongoose.Types.ObjectId(planId)
      }
    });
  }

  if (monthId && planId) {
    query.push({
      $match: {
        monthId: new mongoose.Types.ObjectId(monthId),
        planId: new mongoose.Types.ObjectId(planId)
      }
    });
  }

  if (monthId && paidstatus && planId) {
    query.push({
      $match: {
        monthId: new mongoose.Types.ObjectId(monthId),
        planId: new mongoose.Types.ObjectId(planId),
        paidStatus: parseInt(paidstatus)
      }
    });
  }

  if (q) {
    query.push({
      $match: {
        $or: [
          {
            memberName: {
              $regex: q || '',
              $options: 'i'
            }
          },
          {
            generatedId: {
              $regex: q || '',
              $options: 'i'
            }
          },
          {
            mobile: {
              $regex: q || '',
              $options: 'i'
            }
          }
        ]
      }
    });
  }

  const pipeline = [
    ...query,
    {
      $lookup: {
        from: 'tbl_members',
        localField: 'memberId',
        foreignField: '_id',
        as: 'member'
      }
    },
    {
      $unwind: '$member'
    },
    {
      $lookup: {
        from: 'tbl_plans_mappings',
        localField: 'planMappingId',
        foreignField: '_id',
        as: 'planMapping'
      }
    },
    {
      $unwind: {
        path: '$planMapping',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: 'tbl_plans_mstrs',
        localField: 'planMapping.planId',
        foreignField: '_id',
        as: 'plan'
      }
    },
    {
      $unwind: {
        path: '$plan',
        preserveNullAndEmptyArrays: true
      }
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
      $unwind: {
        path: '$month',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        member: {
          _id: '$member._id',
          memberName: '$member.memberName',
          mobile: '$member.mobile',
          email: '$member.email',
          dob: '$member.dob',
          address: '$member.address',
          generatedId: '$member.generatedId'
        },
        plan: {
          _id: '$plan._id',
          planName: '$plan.planName',
          amount: '$planMapping.amount'
        },
        month: {
          _id: '$month._id',
          month: '$month.monthName'
        },
        planMapping: {
          _id: '$planMapping._id',
          planName: '$planMapping.planName',
          amount: '$planMapping.amount'
        },
        amount: 1,
        paidAmount: 1,
        dueAmount: 1,
        paidStatus: 1,
        expInStatus: 1
      }
    }
  ];

  try {
    const monthwisePlanwiseReport = Subscription.aggregate(pipeline);
    const aggregatePaginate = await Subscription.aggregatePaginate(
      monthwisePlanwiseReport,
      options
    );

    res.status(200).json({
      success: true,
      message: 'Monthwise and planwise report fetched successfully',
      data: aggregatePaginate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
