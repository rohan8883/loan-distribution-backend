import mongoose from 'mongoose';
import moment from 'moment';
import Subscription from '../models/subscriptions.model.js';
import PlanMapping from '../models/plansMapping.model.js';
import Receipt from '../models/receipt.model.js';
import Member from '../models/members.modal.js';
import MonthMaster from '../models/monthMaster.model.js';
import PlanMaster from '../models/planMaster.model.js';
import ExpiredSub from '../models/expiredSub.js';
import User from '../models/user.model.js';
async function creteSubs(memberId, planMappingId, customStartDate,req) {
  const ownerId = req?.user?._id;
  try {
    const plan = await PlanMapping.findById(planMappingId);
    const monthMstr = await MonthMaster.findById(plan.monthId);
    const planMstr = await PlanMaster.findById(plan.planId);

    if (!plan) {
      return { message: 'Plan not found', success: false };
    }

    const planName = planMstr.planName;
    const planId = planMstr._id;
    const monthId = monthMstr._id;
    const month = monthMstr.monthName;
    const amount = plan.amount;
    const paidAmount = 0;
    const dueAmount = 0;
    // if endDate is less than current date then return subscription already exists
    // const subscriptionExists = await Subscription.findOne({
    //   memberId,
    //   planMappingId,
    //   endDate: {
    //     $gte: moment().toISOString()
    //   }
    // });
    // if (subscriptionExists) {
    //   return { message: 'Subscription already exists', success: false };
    // }

    const subscriptionExists = await Subscription.findOne({
      memberId,
      planId
    }).sort({ createdAt: -1 });

    const expSubscription = await Subscription.findOne({
      memberId,
      planId,
      expInStatus: 1
    });

    const lastDate = subscriptionExists
      ? subscriptionExists.endDate
      : moment().toISOString();

    const subscription = new Subscription({
      planMappingId,
      memberId,
      planId,
      planName,
      monthId,
      month,
      // startDate: moment().toISOString(),
      // endDate: moment().add(month, 'months').toISOString(),
      startDate: customStartDate || lastDate,
      endDate: customStartDate
        ? moment(customStartDate).add(month, 'months').toISOString()
        : moment(lastDate).add(month, 'months').toISOString(),
      amount,
      paidAmount,
      dueAmount,
      createdById: ownerId
    });
    const newSubscription = await subscription.save();

    if (!newSubscription) {
      return { message: 'Subscription not created', success: false };
    }
    if (expSubscription) {
      await Subscription.updateMany(
        {
          memberId,
          _id: expSubscription._id,
          expInStatus: 1
        },
        { expInStatus: 2 }
      );
    }

    return {
      message: 'Subscription created successfully',
      success: true,
      newSubscription
    };
  } catch (error) {
    return { message: error.message, success: false };
  }
}

// create new subscription
export const createNewSubscription = async (req, res) => {
  const { memberId, subscriptionData, customStartDate } = req.body;
  try {
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(200).json({ message: 'Member not found' });
    }
    if (member.status == 0) {
      return res.status(200).json({ message: 'Member is inactive' });
    }

    let data = {};

    const subscription = Promise.all(
      subscriptionData.map(async (item) => {
        const { planMappingId } = item;
        const subs = await creteSubs(memberId, planMappingId, customStartDate,req);
        data = subs;
      })
    );

    await subscription;

    return res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// get subscription by member id and paid status 0 and 2
export const getDueSubscription = async (req, res) => {
  const { id } = req.params;
  try {
    const MemberData = await Member.aggregate([
      {
        $lookup: {
          from: 'tbl_subscriptions',
          localField: '_id',
          foreignField: 'memberId',
          as: 'subscription',
          pipeline: [
            {
              $match: {
                paidStatus: {
                  $in: [0, 2]
                }
              }
            }
          ]
        }
      },
      // total paidAmount, dueAmount and totalAmount of member or dueAmount + paidAmount = actualPaidAmount
      {
        $addFields: {
          totalPaidAmount: {
            $sum: '$subscription.paidAmount'
          },
          totalDueAmount: {
            $sum: '$subscription.dueAmount'
          },
          totalAmount: {
            $sum: '$subscription.amount'
          },
          // PlanExecutor error during aggregation :: caused by :: $add only supports numeric or date types, not array fix it
          actualPaidAmount: {
            $add: [
              {
                $sum: '$subscription.paidAmount'
              },
              {
                $sum: '$subscription.dueAmount'
              }
            ]
          }
        }
      },
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id)
        }
      },
      {
        $project: {
          _id: 1,
          memberName: 1,
          generatedId: 1,
          email: 1,
          mobile: 1,
          address: 1,
          subscription: 1,
          totalPaidAmount: 1,
          totalDueAmount: 1,
          totalAmount: 1,
          actualPaidAmount: 1
        }
      }
    ]);
    return res.status(200).json({ success: true, data: MemberData[0] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// update subscription by id and paidAmount and dueAmount and paidStatus 1 if paidAmount is equal to amount then paidStatus will be 1 else 2 and dueAmount will be amount - paidAmount body data array
export const updateSubscription = async (req, res) => {
  const ownerId = req.user._id;
  const { memberId, subData } = req.body;
  try {
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(200).json({ message: 'Member not found' });
    }
    if (member.status == 0) {
      return res.status(200).json({ message: 'Member is inactive' });
    }

    const subscription = subData.map(async (item) => {
      const { id, paidAmount, dueAmount } = item;
      const subscriptionData = await Subscription.findById(id).populate(
        'memberId'
      );
      if (!subscriptionData) {
        return res
          .status(200)
          .json({ success: false, message: 'Subscription not found' });
      }
      const amount = subscriptionData.amount;
      const totalAmount = paidAmount + dueAmount;
      const paidStatus = paidAmount == amount ? 1 : 2;
      const updatedSubscription = await Subscription.findByIdAndUpdate(id, {
        paidAmount,
        dueAmount,
        paidStatus
      });
      if (!updatedSubscription) {
        return res
          .status(200)
          .json({ success: false, message: 'Subscription not updated' });
      }
    });

    await subscription;

    const receiptCount = await Receipt.find({createdById:ownerId}).countDocuments();

    const receipt = new Receipt({
      memberId,
      subscriptionId: subData.map((item) => ({
        subscriptionId: item.id,
        paidAmount: item.paidAmount,
        dueAmount: item.dueAmount,
        startDate: item.startDate,
        endDate: item.endDate,
        amount: item.amount,
        planName: item.planName,
        month: item.month,
        createdById:ownerId,
        prevDueAmount: item.prevDueAmount,
        paidStatus: item.paidAmount == item.amount ? 1 : 2
      })),

      receiptNo: `R-${receiptCount + 1}`.padStart(5, '0'),
      receiptDate: moment().toISOString(),
      totalPaidAmount: subData.reduce((acc, item) => acc + item.paidAmount, 0),
      totalDueAmount: subData.reduce((acc, item) => acc + item.dueAmount, 0),
      totalPrevDueAmount: subData.reduce(
        (acc, item) => acc + item.prevDueAmount,
        0
      ),
      paymentMode: 'Cash',
      paymentStatus: 0
    });

    const newReceipt = await receipt.save();
    if (!newReceipt) {
      return res
        .status(200)
        .json({ success: false, message: 'Receipt not created' });
    }

    return res.status(200).json({
      success: true,
      message: 'Amount paid successfully',
      data: newReceipt
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// update subscription by id
export const updateSubscriptionById = async (req, res) => {
  const { id } = req.params;
  const { paidAmount, dueAmount, paidStatus } = req.body;
  try {
    const subscription = await Subscription.findById(id);
    if (!subscription) {
      return res
        .status(404)
        .json({ success: false, message: 'Subscription not found' });
    }
    await Subscription.findByIdAndUpdate(id, {
      paidAmount,
      dueAmount,
      paidStatus
    });
    return res
      .status(200)
      .json({ success: true, message: 'Subscription updated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// get all receipts join subscriptionId
export const getAllReceipts = async (req, res) => {
  const { page, limit, q, memberid } = req.query;
  const options = { page, limit };

  let query = [
    {
      $sort: {
        createdAt: -1
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
              ...(req.user.roleId =='67193213e0e76d08635e31fb'?{}:{createdById: new mongoose.Types.ObjectId(req?.user?._id)}),
            }
          }
        ]
      }
    },
    { $unwind: '$member' },
    {
      $project: {
        __v: 0,
        'subscription.__v': 0,
        'member.__v': 0
      }
    }
  ];

  try {
    if (q) {
      query.push({
        $match: {
          $or: [
            { receiptNo: { $regex: new RegExp(q, 'i') } },
            { paymentMode: { $regex: new RegExp(q, 'i') } },
          ]
        }
      });
    }

    if (memberid) {
      query.push({
        $match: {
          memberId: new mongoose.Types.ObjectId(memberid)
        }
      });
    }

    const aggregate = Receipt.aggregate(query);

    const receipts = await Receipt.aggregatePaginate(aggregate, options);

    return res.status(200).json({
      success: true,
      message: 'Fetched successfully.',
      data: receipts
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// get receipt by id

export const getReceiptById = async (req, res) => {
  const { id } = req.params;
  try {
   
    const receipts = await Receipt.findOne({ _id: id })
      .populate('subscriptionId.subscriptionId')
      .populate('memberId');

    if (!receipts) {
      return res.status(400).json({
        success: true,
        message: 'No record found!'
      });
    }
    const userDetails = await User.findOne({_id:receipts?.memberId?.createdById });

    return res.status(200).json({
      success: true,
      message: 'Fetched successfully.',
      data: receipts,
      userDetails:userDetails
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// delete subscription by id
export const deleteSubscriptionById = async (req, res) => {
  const { id } = req.body;
  try {
    const subscription = await Subscription.findByIdAndDelete(id);
    if (!subscription) {
      return res.status(200).json({
        success: false,
        message: 'Subscription not found'
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Subscription deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// scheduler update expIn 'expired' if endDate is less than current date
export const updateExpiredSubscription = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({
      endDate: {
        $lt: new Date()
      },
      expInStatus: 'active'
    });
    if (!subscriptions) {
      return res.status(200).json({
        success: false,
        message: 'Subscription not found'
      });
    }
    const updatedSubscriptions = await Subscription.updateMany(
      {
        endDate: {
          $lt: new Date()
        },
        expInStatus: 'active'
      },
      { expInStatus: 'expired' }
    );
    if (!updatedSubscriptions) {
      return res.status(200).json({
        success: false,
        message: 'Subscription not updated'
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Subscription updated successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// update subscription by endDate < current date and expInStatus is 1
export const updateExpiredSubscriptionStatus = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({
      endDate: {
        // expInStatus: 0 before 10 days of endDate and expInStatus is 0
        $lt: new Date(new Date().setDate(new Date().getDate() + 10))
      },
      expInStatus: 0
    }).sort({ createdAt: -1 });

    if (!subscriptions) {
      // return res.status(200).json({
      //   success: false,
      //   message: 'Subscription not found'
      // });
      return console.log('Subscription not found');
    }
    const updatedSubscriptions = await Subscription.updateMany(
      {
        _id: { $in: subscriptions.map((item) => item._id) }
      },
      { expInStatus: 1 }
    );
    if (!updatedSubscriptions) {
      // return res.status(200).json({
      //   success: false,
      //   message: 'Subscription not updated'
      // });
      return console.log('Subscription not updated');
    }
    // return res.status(200).json({
    //   success: true,
    //   message: 'Subscription updated successfully'
    // });
    return console.log('Subscription updated successfully');
  } catch (error) {
    // return res.status(500).json({
    //   success: false,
    //   message: error.message
    // });
    return console.log(error.message);
  }
};

// get all expired subscriptions endDate is less than current date then dump subscription data to expiredSub collection
export const dumpExpiredSubscription = async (req, res) => {
  try {
    const getExpData = await ExpiredSub.find();

    const subscriptions = await Subscription.find({
      endDate: {
        $lt: new Date()
      },
      _id: { $nin: getExpData.map((item) => item.subscriptionId) }
    });

    if (!subscriptions) {
      return res.status(200).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // promise all
    const expiredSub = Promise.all(
      subscriptions.map(async (item) => {
        const expired = new ExpiredSub({
          subscriptionId: item._id,
          memberId: item.memberId,
          planMappingId: item.planMappingId,
          memberName: item.memberName,
          planName: item.planName,
          month: item.month,
          startDate: item.startDate,
          endDate: item.endDate,
          amount: item.amount,
          paidAmount: item.paidAmount,
          dueAmount: item.dueAmount
        });
        await expired.save();
      })
    );

    await expiredSub;

    return res.status(200).json({
      success: true,

      message: 'Subscription dumped successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// get all expired subscriptions with pagination and search join with members and plansMapping and plansMaster and monthMaster
export const getAllExpiredSubscriptions = async (req, res) => {
  const { page, limit, q } = req.query;
  const options = { page, limit };

  try {
    let query = [
      // join with members
      {
        $lookup: {
          from: 'tbl_members',
          localField: 'memberId',
          foreignField: '_id',
          as: 'member'
        }
      },
      { $unwind: '$member' },
      // join with plansMapping
      {
        $lookup: {
          from: 'tbl_plans_mappings',
          localField: 'planMappingId',
          foreignField: '_id',
          as: 'planMapping'
        }
      },
      { $unwind: '$planMapping' },

      {
        $match: {
          $or: [
            { 'member.memberName': { $regex: new RegExp(q, 'i') } },
            { startDate: { $regex: new RegExp(q, 'i') } },
            { endDate: { $regex: new RegExp(q, 'i') } },
            { amount: { $regex: new RegExp(q, 'i') } },
            { paidAmount: { $regex: new RegExp(q, 'i') } },
            { dueAmount: { $regex: new RegExp(q, 'i') } }
          ]
        }
      },
      {
        $sort: {
          createdAt: -1
        }
      },
      {
        $project: {
          __v: 0,
          memberId: 0,
          planMappingId: 0
        }
      }
    ];

    const aggregate = ExpiredSub.aggregate(query);
    const expiredSubscriptions = await ExpiredSub.aggregatePaginate(
      aggregate,
      options
    );

    if (!expiredSubscriptions) {
      return res.status(400).json({
        success: true,
        message: 'No record found!'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Fetched successfully.',
      data: expiredSubscriptions
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// update expInStatus by id
export const updateExpInStatusById = async (req, res) => {
  const { id } = req.params;
  try {
    const subscription = await Subscription.findByIdAndUpdate(id, {
      expInStatus: 3
    });
    if (!subscription) {
      return res.status(200).json({
        success: false,
        message: 'Subscription not found'
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Delete Expired Subscription successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
