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
import Loan from '../models/loan.model.js';

dotenv.config();

// env of multi user db ====>   mongodb+srv://rohansingh9135:Rohan!123!456@cluster0.irrxqdp.mongodb.net/multiusergymdb?retryWrites=true&w=majority&appName=Cluster0


export const createOwnerNew = async (req, res) => {
  const upload = await uploadFile('./uploads/profile');
  try {
    await upload.single('imageUrl')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message, success: false });
      }
      const {
        fullName,
        gymName,
        address,
        mobile,
        password,
        email,
      } = req.body;

      const userExists = await User.findOne({ mobile: mobile });
      if (userExists) {
        return res.status(400).json({
          message: 'User already exists with this mobile number',
          success: false
        });
      }

      const hashPassword = await hash(String(password ?? '12345678'));
      const user = new User({
        fullName: fullName,
        gymName,
        roleId: '676e3938d0f5a92c824fc662',
        mobile,
        email,
        password: hashPassword,
        imageUrl: req?.file?.filename,
        address,
        fullImgUrl: `${process.env.BACKEND_URL}/${req?.file?.filename}`
      });
      const newUser = await user.save();

      if (!newUser._id) {
        return res.status(400).json({ message: 'User not created', success: false });
      }

      return res.status(201).json({
        message: 'User created successfully',
        success: true,
        data: newUser
      });
    });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};


export const getAllOwners = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const ownerRoleId = '676e3938d0f5a92c824fc662'; // Make sure this matches the roleId used in createOwnerNew

    const totalOwners = await User.countDocuments({ roleId: ownerRoleId });
    const owners = await User.find({ roleId: ownerRoleId })
      .select('-password') // Exclude password from the response
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // Sort by creation date, newest first

    if (!owners.length && page !== 1) {
      return res.status(404).json({
        message: 'No owners found for this page',
        success: false
      });
    }

    return res.status(200).json({
      message: 'Owners retrieved successfully',
      success: true,
      data: {
        owners,
        totalDocs: totalOwners,  // Total number of owners
        limit,                   // Limit per page
        page,                    // Current page
        totalPages: Math.ceil(totalOwners / limit),  // Total number of pages
        pagingCounter: (skip + 1), // The first document number of the current page
        hasPrevPage: page > 1,   // Whether the previous page exists
        hasNextPage: page * limit < totalOwners, // Whether the next page exists
        prevPage: page > 1 ? page - 1 : null, // The previous page number
        nextPage: page * limit < totalOwners ? page + 1 : null // The next page number
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error retrieving owners',
      error: error.message,
      success: false
    });
  }
};


export const getOwnerById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'users not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Get user Details by id successfully.',
      data: user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


export const updateOwnerById = async (req, res) => {
  const { id } = req.params;
  const upload = await uploadFile('./uploads/profile');

  try {
    const owner = await User.findById(id);
    if (!owner) {
      return res
        .status(404)
        .json({ success: false, message: 'Owner not found' });
    }

    await upload.single('imageUrl')(req, res, async (err) => {
      if (err) {
        return res.status(200).json({ message: err.message });
      }

      const {
        fullName,
        address,
        mobile,
        email,
        imageUrl = req?.file?.filename,
        fullImgUrl = `${process.env.BACKEND_URL}/${req?.file?.filename}`
      } = req.body;

      if (req.file) {
        // if image is uploaded then delete previous image
        // fs?.unlinkSync(`./uploads/profile/${member?.imageUrl}`);
        const updatedOwner = await User.findByIdAndUpdate(
          id,
          {
            fullName,
            address,
            mobile,
            email,
            imageUrl,
            fullImgUrl
          },
          { new: true }
        );
        return res.status(200).json({
          success: true,
          data: updatedOwner,
          message: 'Owner updated with image'
        });
      }

      const updatedOwner = await User.findByIdAndUpdate(
        id,
        {
          fullName,
          address,
          mobile,
          email,
        },
        { new: true }
      );
      return res.status(200).json({
        success: true,
        data: updatedOwner,
        message: 'Owner updated without image'
      });
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateOwnerStatusById = async (req, res) => {
  const { id } = req.params;
  try {
    const owner = await User.findById(id);
    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Owner not found'
      });
    }
    owner.status = owner.status === 1 ? 0 : 1;
    await owner.save();
    return res.status(200).json({
      success: true,
      message: 'Owner status updated successfully',
      data: owner
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}


export const createMemberNew = async (req, res) => {
  const ownerId = req.user._id;
  const upload = await uploadFile('./uploads/profile');

  try {
    await upload.single('imageUrl')(req, res, async (err) => {
      if (err) {
        return res.status(200).json({ message: err.message });
      }

      const { memberName, address, mobile, email, gender, amount, interestRate, durationMonths, startDate, loanType } = req.body;

      const memberExists = await Member.findOne({ mobile: mobile });
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
        return res.status(200).json({ message: 'User not created', success: false });
      }

      const generated = await Member.find({ createdById: ownerId }).countDocuments();
      const generatedCode =
        gender === 'male'
          ? `M-${('0000' + (generated + 1)).slice(-5)}`
          : gender === 'female'
            ? `F-${('0000' + (generated + 1)).slice(-5)}`
            : `O-${('0000' + (generated + 1)).slice(-5)}`;

      const member = new Member({
        generatedId: generatedCode,
        userId,
        memberName,
        address,
        mobile,
        // dob,
        email,
        gender,
        createdById: ownerId,
        // weight,
        imageUrl: req?.file?.filename,
        fullImgUrl: `${process.env.BACKEND_URL}/${req.file?.filename}`
      });

      await member.save();

      // Loan creation logic
      const monthlyInterestRate = (interestRate / 100) / 12;
      let monthlyPayment = amount;
      if (monthlyInterestRate > 0) {
        const numerator = monthlyInterestRate * Math.pow(1 + monthlyInterestRate, durationMonths);
        const denominator = Math.pow(1 + monthlyInterestRate, durationMonths) - 1;
        monthlyPayment = amount * (numerator / denominator);
      } else {
        // If interest rate is 0, just divide the principal by the number of months
        monthlyPayment = amount / durationMonths;
      }

      const totalAmountDue = monthlyPayment * durationMonths;

      // Create loan start date (either provided or current date)
      const loanStartDate = startDate ? new Date(startDate) : new Date();

      // Generate a unique loan number (e.g., LN-2024-1001)
      const generateLoanNumber = () => {
        const today = new Date();
        const year = today.getFullYear();
        const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit random
        return `LN-${year}-${randomNum}`;
      };
      const loanNumber = generateLoanNumber();

      const newLoan = new Loan({
        userId,
        amount,
        loanNumber,
        loanType,
        interestRate,
        startDate: loanStartDate,
        durationMonths,
        totalAmountDue,
        monthlyPayment,
        remainingBalance: totalAmountDue,
        createdById: ownerId,
        status: 'approved', // You might want to change this based on your workflow
      });

      await newLoan.save();

      return res.status(201).json({
        message: 'Member and loan created successfully',
        success: true,
        data: { member, loan: newLoan }
      });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// get all members with pagination aggregate query q=

export const getAllMembers = async (req, res) => {
  const ownerId = req.user._id;
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
    if (req.user.roleId == '676e3938d0f5a92c824fc662') {
      query.push({
        $match: {
          createdById: new mongoose.Types.ObjectId(ownerId)
        }
      });
    }
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

    const userDetails = await User.findOne({ _id: MemberData[0]?.createdById });

    return res.status(200).json({
      success: true,
      message: 'Member found',
      data: { ...MemberData[0], ExpStatus, userDetails }
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
