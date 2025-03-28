import User from '../models/user.model.js';
import Loan from '../models/loan.model.js';
import PaymentHistory from '../models/loanHistory.model.js'; 

// Create "Give Loan to User"
export async function GiveLoan(req, res) {
  const ownerId = req?.user?._id;
  try {
    const { userId, amount, interestRate, durationMonths } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const monthlyInterestRate = (interestRate / 100) / 12;
    const totalAmountDue = amount * Math.pow(1 + monthlyInterestRate, durationMonths);
    const monthlyPayment = totalAmountDue / durationMonths;

    const newLoan = new Loan({
      user: userId,
      amount,
      interestRate,
      durationMonths,
      totalAmountDue,
      monthlyPayment,
      createdById: ownerId,
    });

    await newLoan.save();
    res.status(201).json(newLoan);
  } catch (err) {
    res.status(400).json({ message: 'Error creating loan', error: err.message });
  }
}
export async function GetAllLoans(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query; // Default page 1, limit 10
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    const totalLoans = await Loan.countDocuments();
    const loans = await Loan.find()
      .populate('user', 'fullName email mobile')
      .populate('createdById', 'name email')
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    if (!loans.length) {
      return res.status(404).json({ success: false, message: 'No loans found' });
    }

    res.status(200).json({
      success: true,
      totalLoans,
      totalPages: Math.ceil(totalLoans / limitNumber),
      currentPage: pageNumber,
      data: loans,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching loans', error: err.message });
  }
}

// Get a loan by ID with user details
export async function GetLoanById(req, res) {
  try {
    const { id } = req.params; // Extract loanId from URL parameter

    // Fetch the loan by its ID and populate user details
    const loan = await Loan.findById(id)
      .populate('user', 'name email')  // Populate user details (add more fields as needed)
      .populate('createdById', 'name email');  // Populate the creator's details

    if (!loan) {
      return res.status(200).json({ message: 'Loan not found' });
    }

    res.status(200).json({
      success: true,
      message: 'fetching loan by ID',
      loan
    });
  } catch (err) {
    res.status(400).json({ message: 'Error fetching loan', error: err.message });
  }
}


// Handle loan payment
export async function MakeLoanPayment(req, res) {
  try {
    const { loanId, paymentAmount } = req.body;
    const userId = req?.user?._id;

    // Find the loan by ID
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    // Check if the user making the payment is the loan's borrower
    if (loan.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You are not authorized to make this payment' });
    }

    // Calculate the remaining balance after the payment
    const remainingBalance = loan.totalAmountDue - paymentAmount;

    if (remainingBalance < 0) {
      return res.status(400).json({ message: 'Payment amount exceeds outstanding balance' });
    }

    // If the payment clears the balance, set the loan status to 'Paid'
    if (remainingBalance === 0) {
      loan.status = 'Paid';
    }

    // Save the updated loan balance
    loan.totalAmountDue = remainingBalance;
    await loan.save();

    // Save the payment to the PaymentHistory model
    const paymentHistory = new PaymentHistory({
      loanId,
      userId,
      amountPaid: paymentAmount,
      remainingBalance,
    });
    await paymentHistory.save();

    // Return updated loan and payment info
    res.status(200).json({
      message: 'Payment successful',
      remainingBalance,
      loanStatus: loan.status,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error processing payment', error: err.message });
  }
}
// Get monthly payment report for a user
export async function GetMonthlyLoanReport(req, res) {
  try {
    const { loanId } = req.params; // Get the loan ID from the URL parameter
    const { year, month } = req.query; // Get the year and month from the query parameters

    // Validate year and month
    if (!year || !month) {
      return res.status(400).json({ message: 'Year and month are required' });
    }

    // Convert month to 0-based index (January is 0)
    const startOfMonth = moment(`${year}-${month}-01`).startOf('month');
    const endOfMonth = moment(`${year}-${month}-01`).endOf('month');

    // Find payments for the loan within the specified month
    const payments = await PaymentHistory.find({
      loanId,
      paymentDate: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() },
    }).sort({ paymentDate: 1 });

    if (payments.length === 0) {
      return res.status(404).json({ message: 'No payments found for this month' });
    }

    // Get the loan details
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    // Prepare the report data
    const reportData = payments.map(payment => ({
      paymentDate: payment.paymentDate,
      amountPaid: payment.amountPaid,
      remainingBalance: payment.remainingBalance,
    }));

    // Send the monthly report as a response
    res.status(200).json({
      loanId,
      loanAmount: loan.amount,
      totalPayments: payments.length,
      reportData,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error generating report', error: err.message });
  }
}