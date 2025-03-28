///////////////////////////////////////////////////////// DEPENDENCIES /////////////////////////////////////////////////////////////////

import { Schema, model } from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
const PaymentHistorySchema = new Schema({
  loanId: { type: Schema.Types.ObjectId, ref: 'Loan', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amountPaid: { type: Number, required: true },
  paymentDate: { type: Date, default: Date.now },
  remainingBalance: { type: Number, required: true },
});
PaymentHistorySchema.plugin(aggregatePaginate);

const PaymentHistory = model('PaymentHistory', PaymentHistorySchema);
export default PaymentHistory;



// const PaymentHistory = mongoose.model('PaymentHistory', PaymentHistorySchema);
// export default PaymentHistory;
