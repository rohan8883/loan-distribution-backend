///////////////////////////////////////////////////////// DEPENDENCIES /////////////////////////////////////////////////////////////////

import { Schema, model } from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

const SubscriptionSchema = new Schema(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'tbl_members' // Refers to GymMembers model
    },
    planMappingId: {
      type: Schema.Types.ObjectId,
      ref: 'tbl_plans_mappings' // Refers to PlansMapping model
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'tbl_plans_mstrs' // Refers to Plans model
    },
    monthId: {
      type: Schema.Types.ObjectId,
      ref: 'tbl_month_mstrs' // Refers to Months model
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
    createdById: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      path: '_id',
    },
    expInStatus: {
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

SubscriptionSchema.plugin(aggregatePaginate);

const Subscription = model('tbl_subscriptions', SubscriptionSchema);

export default Subscription;
