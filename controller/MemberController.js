import Member from '../models/members.modal.js';
import fs from 'fs';
import User from '../models/user.model.js';
import Plans from '../models/plansMapping.model.js';
import Subscription from '../models/subscriptions.model.js';
import { uploadFile } from '../middleware/_multer.js';
import moment from 'moment';
import { hash } from '../utils/index.js';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

export const createMemberNew = async (req, res) => {
  const upload = await uploadFile('./uploads/profile');
  try {
    await upload.single('imageUrl')(req, res, async (err) => {
      if (err) {
        return res.status(200).json({ message: err.message });
      }
      const {
        memberName,
        address,
        mobile,
        dob,
        email,
        gender,
        weight,
        planMappingId
      } = req.body;

      const memberExists = await Member.findOne({
        mobile: mobile
      });
      if (memberExists) {
        return res.status(200).json({
          message: 'Member already exists with this mobile number',
          success: false
        });
      }

      const hashPassword = await hash(String('123456'));
      const user = new User({
        fullName: memberName,
        roleId: '67193235e0e76d08635e31fc',
        mobile,
        email,
        password: hashPassword,
        imageUrl: req?.file?.filename,
        address,
        fullImgUrl: `${process.env.BACKEND_URL}/${req?.file?.filename}`
      });
      const newUser = await user.save();
      const userId = newUser._id;
      if (!userId) {
        return res
          .status(200)
          .json({ message: 'User not created', success: false });
      }

      const generated = await Member.find().countDocuments();
      const generatedCode =
        gender == 'male'
          ? `M-${('0000' + (generated + 1)).slice(-5)}`
          : gender == 'female'
          ? `F-${('0000' + (generated + 1)).slice(-5)}`
          : `O-${('0000' + (generated + 1)).slice(-5)}`;

      const member = new Member({
        generatedId: generatedCode,
        userId,
        memberName,
        address,
        mobile,
        dob,
        email,
        gender,
        planMappingId: JSON.parse(planMappingId),
        weight,
        imageUrl: req?.file?.filename,
        fullImgUrl: `${process.env.BACKEND_URL}/${req.file?.filename}`
      });
      await member.save();
      return res.status(201).json({
        message: 'Member created',
        success: true,
        data: member
      });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// get all members with pagination aggregate query q=
export const getAllMembers = async (req, res) => {
  const { page = 1, limit = 10, q, status } = req.query;
  try {
    const options = { page, limit };

    let query = [
      {
        $sort: {
          createdAt: -1
        }
      }
    ];

    if (q) {
      query.push({
        $match: {
          $or: [
            { memberName: { $regex: new RegExp(q, 'i') } },
            { mobile: { $regex: new RegExp(q, 'i') } },
            {
              generatedId: { $regex: new RegExp(q, 'i') }
            }
          ]
        }
      });
    }

    // if (status) {
    //   query.push({
    //     $match: {
    //       status: parseInt(status)
    //     }
    //   });
    // }

    query.push({
      $match: {
        status: parseInt(status) || 1
      }
    });

    const MemberData = Member.aggregate([
      ...query,
      {
        $lookup: {
          from: 'tbl_plans_mappings',
          localField: 'planMappingId',
          foreignField: '_id',
          as: 'planMappingId',
          pipeline: [
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
                from: 'tbl_plans_mstrs',
                localField: 'planId',
                foreignField: '_id',
                as: 'planName'
              }
            },

            {
              $unwind: '$planName'
            },
            {
              $project: {
                _id: 1,
                amount: 1,
                status: 1,
                planMappingId: 1,
                monthId: 1,
                planId: 1,
                month: '$month.monthName',
                plan: '$planName.planName'
              }
            }
          ]
        }
      },

      {
        $lookup: {
          from: 'tbl_subscriptions',
          localField: '_id',
          foreignField: 'memberId',
          as: 'subscription'
        }
      }
    ]);

    const members = await Member.aggregatePaginate(MemberData, options);
    return res
      .status(200)
      .json({ success: true, message: 'Members found', data: members });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// get member by id with populate planMappingId and userId fields
export const getMemberById = async (req, res) => {
  const { id } = req.params;

  const ExpStatus = await Subscription.aggregate([
    {
      $match: {
        memberId: new mongoose.Types.ObjectId(id)
      }
    },
    // {
    //   $sort: {
    //     createdAt: -1
    //   }
    // },
    {
      $group: {
        _id: '$planId',
        subsId: { $last: '$_id' },
        endDate: { $last: '$endDate' },
        startDate: { $last: '$startDate' },
        amount: { $last: '$amount' },
        paidAmount: { $last: '$paidAmount' },
        dueAmount: { $last: '$dueAmount' },
        paidStatus: { $last: '$paidStatus' },
        expInStatus: { $last: '$expInStatus' },
        planName: { $last: '$planName' },
        month: { $last: '$month' }
      }
    }
  ]);

  try {
    const MemberData = await Member.aggregate([
      {
        $lookup: {
          from: 'tbl_plans_mappings',
          localField: 'planMappingId',
          foreignField: '_id',
          as: 'planMappingId',
          pipeline: [
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
                from: 'tbl_plans_mstrs',
                localField: 'planId',
                foreignField: '_id',
                as: 'planName'
              }
            },

            {
              $unwind: '$planName'
            },
            {
              $project: {
                _id: 1,
                amount: 1,
                status: 1,
                planMappingId: 1,
                monthId: 1,
                planId: 1,
                month: '$month.monthName',
                plan: '$planName.planName'
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: 'tbl_subscriptions',
          localField: '_id',
          foreignField: 'memberId',
          as: 'subscription',
          pipeline: [
            {
              $sort: {
                createdAt: -1
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
      }
    ]);
    return res.status(200).json({
      success: true,
      message: 'Member found',
      data: { ...MemberData[0], ExpStatus }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// update member by id
export const updateMemberById = async (req, res) => {
  const { id } = req.params;
  const upload = await uploadFile('./uploads/profile');

  try {
    const member = await Member.findById(id);
    if (!member) {
      return res
        .status(404)
        .json({ success: false, message: 'Member not found' });
    }

    await upload.single('imageUrl')(req, res, async (err) => {
      if (err) {
        return res.status(200).json({ message: err.message });
      }

      const {
        memberName,
        address,
        mobile,
        dob,
        email,
        gender,
        planMappingId,
        weight,
        imageUrl = req?.file?.filename,
        fullImgUrl = `${process.env.BACKEND_URL}/${req?.file?.filename}`
      } = req.body;

      if (req.file) {
        // if image is uploaded then delete previous image
        // fs?.unlinkSync(`./uploads/profile/${member?.imageUrl}`);
        const updatedMember = await Member.findByIdAndUpdate(
          id,
          {
            memberName,
            address,
            mobile,
            dob,
            email,
            gender,
            planMappingId: JSON.parse(planMappingId),
            weight,
            imageUrl,
            fullImgUrl
          },
          { new: true }
        );
        return res.status(200).json({
          success: true,
          data: updatedMember,
          message: 'Member updated with image'
        });
      }

      const updatedMember = await Member.findByIdAndUpdate(
        id,
        {
          memberName,
          address,
          mobile,
          dob,
          email,
          gender,
          planMappingId: JSON.parse(planMappingId),
          weight
        },
        { new: true }
      );
      return res.status(200).json({
        success: true,
        data: updatedMember,
        message: 'Member updated without image'
      });
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// update only planMappingId of _id,
export const updateMemberPlan = async (req, res) => {
  const { id } = req.params;
  const { planMappingId } = req.body;
  try {
    const member = await Member.findById(id);
    if (!member) {
      return res
        .status(404)
        .json({ success: false, message: 'Member not found' });
    }
    const updatedMember = await Member.findByIdAndUpdate(
      id,
      { planMappingId },
      { new: true }
    );

    return res.status(200).json({ success: true, data: updatedMember });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// update status if status=0 then status=1 and vice versa
export const updateMemberStatusById = async (req, res) => {
  // findAndUpdate status
  const { id } = req.params;
  try {
    const member = await Member.findById(id);
    if (!member) {
      return res
        .status(404)
        .json({ success: false, message: 'Member not found' });
    }

    await User.findByIdAndUpdate(
      member.userId,
      { status: member.status == 1 ? 0 : 1, mobile: 0 },
      { new: true }
    );

    const updatedMember = await Member.findByIdAndUpdate(
      id,
      { status: member.status == 1 ? 0 : 1, mobile: 0 },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      data: updatedMember,
      message: member.status == 1 ? 'Member deactivated' : 'Member activated'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
