///////////////////////////////////////////////////////// DEPENDENCIES /////////////////////////////////////////////////////////////////

import { Schema, model } from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
const loanSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'users', required: true },
  amount: { type: Number, required: true, min: [1, 'Amount must be positive'] },
  interestRate: { type: Number, required: true, min: [0, 'Interest rate cannot be negative'] },
  startDate: { type: Date, default: Date.now },
  durationMonths: { type: Number, required: true, min: [1, 'Duration must be at least 1 month'] },
  totalAmountDue: { type: Number, required: true },
  monthlyPayment: { type: Number, required: true },
  remainingBalance: { type: Number },
  createdById: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  paymentsMade: [
    {
      amount: { type: Number, required: true },
      date: { type: Date, default: Date.now },
      processedBy: { type: Schema.Types.ObjectId, ref: 'users' }
    },
  ],
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'active', 'paid', 'overdue', 'defaulted', 'rejected'], 
    default: 'pending' 
  },
  lastPaymentDate: { type: Date },
  nextPaymentDueDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
}, {
  timestamps: true
});

// Calculate next payment due date
loanSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('startDate')) {
    const startDate = new Date(this.startDate);
    this.nextPaymentDueDate = new Date(startDate);
    this.nextPaymentDueDate.setMonth(startDate.getMonth() + 1);
  }
  next();
});

loanSchema.plugin(aggregatePaginate);

const Loan = model('Loan', loanSchema);

export default Loan;
