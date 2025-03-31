import User from '../models/user.model.js';
import Loan from '../models/loan.model.js';
import PaymentHistory from '../models/loanHistory.model.js';
import mongoose from 'mongoose';
// Create "Give Loan to User"


export async function GetAllLoans(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || null;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build the aggregation pipeline
    const aggregateQuery = Loan.aggregate([
      // Match stage (for filtering)
      {
        $match: status ? { status: status } : {}
      },
      // Lookup to get user details
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      // Unwind the userDetails array
      {
        $unwind: '$userDetails'
      },
      // Lookup to get loan creator details
      {
        $lookup: {
          from: 'users',
          localField: 'createdById',
          foreignField: '_id',
          as: 'creatorDetails'
        }
      },
      // Unwind the creatorDetails array
      {
        $unwind: {
          path: '$creatorDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      // Project to shape the output and exclude sensitive information
      {
        $project: {
          _id: 1,
          amount: 1,
          interestRate: 1,
          startDate: 1,
          durationMonths: 1,
          totalAmountDue: 1,
          monthlyPayment: 1,
          remainingBalance: 1,
          status: 1,
          paymentsMade: 1,
          lastPaymentDate: 1,
          nextPaymentDueDate: 1,
          createdAt: 1,
          updatedAt: 1,
          user: {
            _id: '$userDetails._id',
            name: '$userDetails.fullName',
            email: '$userDetails.email',
            phone: '$userDetails.mobile',
            // Add other user fields you want to include
          },
          creator: {
            _id: '$creatorDetails._id',
            name: '$creatorDetails.name',
            // Add other creator fields you want to include
          }
        }
      },
      // Sort stage
      {
        $sort: { [sortBy]: sortOrder }
      }
    ]);

    // Apply pagination using mongoose-aggregate-paginate-v2
    const options = {
      page,
      limit,
      customLabels: {
        totalDocs: 'totalLoans',
        docs: 'loans'
      }
    };

    const result = await Loan.aggregatePaginate(aggregateQuery, options);

    // Add summary statistics
    const summary = await Loan.aggregate([
      {
        $group: {
          _id: null,
          totalLoans: { $sum: 1 },
          totalAmountLent: { $sum: '$amount' },
          totalAmountDue: { $sum: '$totalAmountDue' },
          totalAmountPaid: {
            $sum: {
              $reduce: {
                input: '$paymentsMade',
                initialValue: 0,
                in: { $add: ['$$value', '$$this.amount'] }
              }
            }
          },
          averageLoanAmount: { $avg: '$amount' },
          statusCounts: {
            $push: '$status'
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalLoans: 1,
          totalAmountLent: 1,
          totalAmountDue: 1,
          totalAmountPaid: 1,
          averageLoanAmount: 1,
          statusCounts: {
            pending: {
              $size: {
                $filter: {
                  input: '$statusCounts',
                  as: 'status',
                  cond: { $eq: ['$$status', 'pending'] }
                }
              }
            },
            active: {
              $size: {
                $filter: {
                  input: '$statusCounts',
                  as: 'status',
                  cond: { $eq: ['$$status', 'active'] }
                }
              }
            },
            paid: {
              $size: {
                $filter: {
                  input: '$statusCounts',
                  as: 'status',
                  cond: { $eq: ['$$status', 'paid'] }
                }
              }
            },
            overdue: {
              $size: {
                $filter: {
                  input: '$statusCounts',
                  as: 'status',
                  cond: { $eq: ['$$status', 'overdue'] }
                }
              }
            }
          }
        }
      }
    ]);

    // Determine appropriate status message based on results
    let message = 'Loans retrieved successfully';
    if (result.totalLoans === 0) {
      message = status
        ? `No loans found with status: ${status}`
        : 'No loans found';
    } else if (status) {
      message = `Found ${result.totalLoans} loans with status: ${status}`;
    }

    res.status(200).json({
      success: true,
      message: message,
      pagination: {
        totalLoans: result.totalLoans,
        limit: result.limit,
        page: result.page,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        nextPage: result.nextPage,
        hasPrevPage: result.hasPrevPage,
        prevPage: result.prevPage
      },
      loans: result.loans,
      summary: summary.length > 0 ? summary[0] : {}
    });

  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Error fetching loans',
      error: err.message
    });
  }
}

export async function GetLoanById(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'Loan ID is required'
      });
    }

    // Validate that loanId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid loan ID format'
      });
    }

    const loan = await Loan.aggregate([
      // Match the specific loan
      {
        $match: { _id: new mongoose.Types.ObjectId(id) }
      },
      // Lookup to get user details
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      // Unwind the userDetails array
      {
        $unwind: '$userDetails'
      },
      // Lookup to get loan creator details
      {
        $lookup: {
          from: 'users',
          localField: 'createdById',
          foreignField: '_id',
          as: 'creatorDetails'
        }
      },
      // Unwind the creatorDetails array
      {
        $unwind: {
          path: '$creatorDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      // Project to shape the output
      {
        $project: {
          _id: 1,
          amount: 1,
          loanNumber:1,
          loanType:1,
          interestRate: 1,
          startDate: 1,
          durationMonths: 1,
          totalAmountDue: 1,
          monthlyPayment: 1,
          remainingBalance: 1,
          status: 1,
          paymentsMade: {
            $map: {
              input: { $range: [0, { $size: "$paymentsMade" }] },
              as: "index",
              in: {
                $mergeObjects: [
                  { $arrayElemAt: ["$paymentsMade", "$$index"] },
                  {
                    status: "paid",
                    paymentNumber: { $add: ["$$index", 1] }
                  }
                ]
              }
            }
          },
          lastPaymentDate: 1,
          nextPaymentDueDate: 1,
          createdAt: 1,
          updatedAt: 1,
          // Payment schedule calculation
          paymentSchedule: {
            $map: {
              input: { $range: [0, '$durationMonths'] },
              as: 'month',
              in: {
                paymentNumber: { $add: ['$$month', 1] },
                dueDate: {
                  $dateAdd: {
                    startDate: '$startDate',
                    unit: 'month',
                    amount: { $add: ['$$month', 1] }
                  }
                },
                amount: '$monthlyPayment',
                status: {
                  $cond: {
                    if: {
                      $lte: [
                        { $add: ['$$month', 1] },  // paymentNumber
                        { $size: { $ifNull: ['$paymentsMade', []] } }  // Number of payments made
                      ]
                    },
                    then: 'paid',
                    else: 'pending'
                  }
                }
              }
            }
          },
          user: {
            _id: '$userDetails._id',
            name: '$userDetails.fullName',
            email: '$userDetails.email',
            phone: '$userDetails.mobile',
            address: '$userDetails.address',
          },
          creator: {
            _id: '$creatorDetails._id',
            name: '$creatorDetails.name',
          }
        }
      }
    ]);

    if (!loan || loan.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: `Loan with ID ${id} not found`
      });
    }

    // Calculate summary information
    const totalPaid = loan[0].paymentsMade.reduce((sum, payment) => sum + payment.amount, 0);
    const remainingBalance = Math.max(0, loan[0].totalAmountDue - totalPaid);

    // Calculate progress percentage
    const progressPercentage = (totalPaid / loan[0].totalAmountDue) * 100;

    // Determine if the loan is on track
    const today = new Date();
    const monthsSinceStart = Math.floor((today - new Date(loan[0].startDate)) / (30 * 24 * 60 * 60 * 1000));
    const expectedPaymentsSoFar = Math.min(monthsSinceStart, loan[0].durationMonths) * loan[0].monthlyPayment;
    const isOnTrack = totalPaid >= (expectedPaymentsSoFar - loan[0].monthlyPayment);

    // Prepare status message based on loan status
    let message = `Loan details retrieved successfully`;
    if (loan[0].status === 'paid') {
      message = `This loan has been fully paid off`;
    } else if (loan[0].status === 'overdue') {
      message = `This loan is currently overdue. Payment required.`;
    } else if (loan[0].status === 'pending' && isOnTrack) {
      message = `Loan is in good standing. Next payment due: ${loan[0].nextPaymentDueDate.toLocaleDateString()}`;
    }

    // Calculate remaining payments count
    const remainingPaymentsCount = loan[0].durationMonths - loan[0].paymentsMade.length;

    // Get upcoming payments (both due and pending)
    const upcomingPayments = [];

    if (remainingPaymentsCount > 0) {
      const nextPaymentIndex = loan[0].paymentsMade.length;
      const paymentsToShow = Math.min(remainingPaymentsCount, 3);

      for (let i = 0; i < paymentsToShow; i++) {
        const paymentNumber = nextPaymentIndex + i + 1;
        const dueDate = new Date(loan[0].startDate);
        dueDate.setMonth(dueDate.getMonth() + nextPaymentIndex + i);

        const status = i === 0 ? 'due' : 'pending';

        upcomingPayments.push({
          paymentNumber,
          date: dueDate,
          amount: loan[0].monthlyPayment,
          status
        });
      }
    }

    // Response with repayment progress included
    res.status(200).json({
      success: true,
      message: message,
      loan: loan[0],
      summary: {
        totalPaid,
        remainingBalance,
        repaymentProgress: parseFloat(progressPercentage.toFixed(2)), // Numeric value (e.g., 45.67)
        repaymentProgressDisplay: `${progressPercentage.toFixed(2)}%`, // Formatted string (e.g., "45.67%")
        isOnTrack,
        paymentsMade: loan[0].paymentsMade.length,
        remainingPayments: remainingPaymentsCount,
        nextPaymentDue: loan[0].nextPaymentDueDate,
        upcomingPayments: upcomingPayments
      }
    });

  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Error fetching loan details',
      error: err.message
    });
  }
}
// Function to generate a transaction number


function generateTransactionNumber() {
  const prefix = 'TXN';
  const timestamp = Date.now().toString().slice(-10);
  const randomDigits = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${timestamp}${randomDigits}`;
}
export async function MakeLoanPayment(req, res) {
  try {
    const { loanId, paymentAmount } = req.body;
    const processedBy = req?.user?._id;

    // Validate loan ID
    if (!loanId) {
      return res.status(400).json({
        status: 'error',
        message: 'Loan ID is required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(loanId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid loan ID format'
      });
    }

    // Find the loan
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({
        status: 'error',
        message: 'Loan not found'
      });
    }

    // Validate payment amount
    if (!paymentAmount || paymentAmount <= 0) {
      return res.status(200).json({
        success: false,
        message: 'Invalid payment amount'
      });
    }

    // Check if payment amount is at least the monthly payment
    if (paymentAmount < loan.monthlyPayment) {
      return res.status(200).json({
        success: false,
        message: `Payment amount must be at least the monthly payment of ${loan.monthlyPayment.toFixed(2)}`
      });
    }
    // Generate a transaction number
    const transactionNumber = generateTransactionNumber();
    // Add the payment to paymentsMade array
    loan.paymentsMade.push({
      amount: paymentAmount,
      date: new Date(),
      processedBy,
      transactionNumber
    });

    // Calculate total paid so far
    const totalPaid = loan.paymentsMade.reduce((sum, payment) => sum + payment.amount, 0);

    // Update remaining balance
    loan.remainingBalance = Math.max(0, loan.totalAmountDue - totalPaid);

    // Update lastPaymentDate
    loan.lastPaymentDate = new Date();

    // Calculate next payment due date
    if (loan.paymentsMade.length < loan.durationMonths) {
      const startDate = new Date(loan.startDate);
      loan.nextPaymentDueDate = new Date(startDate);
      loan.nextPaymentDueDate.setMonth(startDate.getMonth() + loan.paymentsMade.length + 1);
    }

    // Update loan status
    if (totalPaid >= loan.totalAmountDue) {
      loan.status = 'paid';
      loan.nextPaymentDueDate = null; // No more payments needed
    } else {
      // Check if there are any overdue payments
      const monthsSinceStart = Math.floor((new Date() - loan.startDate) / (30 * 24 * 60 * 60 * 1000));
      const expectedPaymentsSoFar = Math.min(monthsSinceStart, loan.durationMonths) * loan.monthlyPayment;

      if (totalPaid < expectedPaymentsSoFar - loan.monthlyPayment) {
        loan.status = 'overdue';
      } else {
        loan.status = 'active';
      }
    }

    await loan.save();

    // Prepare appropriate message based on loan status
    let message = 'Payment processed successfully';
    if (loan.status === 'paid') {
      message = 'Congratulations! This loan has been fully paid off.';
    } else if (loan.status === 'overdue') {
      message = 'Payment processed, but loan is still marked as overdue. Additional payment is needed.';
    } else {
      message = `Payment of ${paymentAmount.toFixed(2)} processed successfully. Remaining balance: ${loan.remainingBalance.toFixed(2)}`;
    }

    // Calculate progress percentage
    const progressPercentage = (totalPaid / loan.totalAmountDue) * 100;

    res.status(200).json({
      success: true,
      message: message,
      payment: {
        amount: paymentAmount,
        date: new Date(),
        loanId: loan._id,
        transactionNumber: transactionNumber
      },
      loanUpdate: {
        _id: loan._id,
        totalPaid,
        remainingBalance: loan.remainingBalance,
        progressPercentage: progressPercentage.toFixed(2),
        status: loan.status,
        paymentsMade: loan.paymentsMade.length,
        remainingPayments: loan.durationMonths - loan.paymentsMade.length,
        nextPaymentDue: loan.nextPaymentDueDate
      }
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error processing payment',
      error: err.message
    });
  }
}

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