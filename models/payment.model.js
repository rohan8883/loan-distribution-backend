///////////////////////////////////////////////////////// DEPENDENCIES /////////////////////////////////////////////////////////////////

import { Schema, model } from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
const paymentSchema =  Schema({
  loan: { type:  Schema.Types.ObjectId, ref: 'Loan', required: true },
  amountPaid: { type: Number, required: true },
  paymentDate: { type: Date, default: Date.now },
},
{
  timestamps: true,
}
);

paymentSchema.plugin(aggregatePaginate);

const payment = model('Payment', paymentSchema);

export default payment;
