///////////////////////////////////////////////////////// DEPENDENCIES /////////////////////////////////////////////////////////////////

import { Schema, model } from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
const loanSchema = new  Schema({
  user: { type: Schema.Types.ObjectId, ref: 'users', required: true },  // reference to User schema
  amount: { type: Number, required: true },   // The principal amount
  interestRate: { type: Number, required: true },  // Annual interest rate in percentage
  startDate: { type: Date, default: Date.now },   // Date when the loan starts
  durationMonths: { type: Number, required: true },   // Loan duration in months
  totalAmountDue: { type: Number, required: true },  // Total amount to be paid after interest
  monthlyPayment: { type: Number, required: true }, 
  createdById: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    path: '_id'
  },  // Calculated monthly payment
  paymentsMade: [
    {
      amount: { type: Number, required: true },
      date: { type: Date, default: Date.now },
    },
  ], 
  status: { type: String, enum: ['pending', 'paid', 'overdue'], default: 'pending' },  // Current status of loan
  createdAt: { type: Date, default: Date.now },
  
},
{
  timestamps: true
});

loanSchema.plugin(aggregatePaginate);

const loan = model('Loan', loanSchema);

export default loan;
