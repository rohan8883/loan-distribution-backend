///////////////////////////////////////////////////////// DEPENDENCIES /////////////////////////////////////////////////////////////////

import { Schema, model } from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

const ExpiredSubSchema = new Schema(
  {
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'tbl_subscriptions' // Refers to Subscription
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'tbl_members' // Refers to GymMembers model
    },
    planMappingId: {
      type: Schema.Types.ObjectId,
      ref: 'tbl_plans_mappings' // Refers to PlansMapping model
    },
    memberName: {
      type: String
    },

    planName: {
      type: String
    },
    month: {
      type: String
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    amount: {
      type: Number
    },
    paidAmount: {
      type: Number
    },
    dueAmount: {
      type: Number
    },
    paidStatus: {
      type: Number,
      default: 0
    },

    status: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: true
  }
);

ExpiredSubSchema.plugin(aggregatePaginate);

const ExpiredSub = model('tbl_exp_subscription', ExpiredSubSchema);

export default ExpiredSub;
