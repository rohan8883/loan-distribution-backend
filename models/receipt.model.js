import { model, Schema } from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

const ReceiptSchema = new Schema(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'tbl_members' // Refers to GymMembers model
    },
    createdById: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      path: '_id'
    },
    subscriptionId: {
      type: Array,
      default: []
    },
    receiptNo: {
      type: String
    },
    receiptDate: {
      type: Date
    },
    totalPaidAmount: {
      type: Number
    },
    totalDueAmount: {
      type: Number
    },
    totalPrevDueAmount: {
      type: Number
    },
    paymentMode: {
      type: String
    },
    paymentStatus: {
      type: String
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

ReceiptSchema.plugin(aggregatePaginate);

const Receipt = model('tbl_receipts', ReceiptSchema);

export default Receipt;
