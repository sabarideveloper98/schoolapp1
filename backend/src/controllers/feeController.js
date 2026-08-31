const FeeCategory = require('../models/FeeCategory');
const FeeStructure = require('../models/FeeStructure');
const StudentFee = require('../models/StudentFee');
const FeePayment = require('../models/FeePayment');
const FeeDiscount = require('../models/FeeDiscount');
const Student = require('../models/Student');
const Class = require('../models/Class');
const School = require('../models/School');

const getSchoolId = async (adminId) => {
    const school = await School.findOne({ admin_id: adminId });
    if (!school) throw new Error('School not found for this admin');
    return school._id;
};

// --- FEE CATEGORY MANAGEMENT ---
const getFeeCategories = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const categories = await FeeCategory.find({ school_id });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const createFeeCategory = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { name, code, description, academic_year, status } = req.body;
        const exists = await FeeCategory.findOne({ school_id, name, academic_year });
        if (exists) {
            return res.status(400).json({ message: 'Category already exists' });
        }
        const category = await FeeCategory.create({
            school_id, name, code, description, academic_year, status
        });
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateFeeCategory = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const category = await FeeCategory.findOneAndUpdate(
            { _id: req.params.id, school_id },
            req.body,
            { new: true }
        );
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteFeeCategory = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        await FeeCategory.findOneAndDelete({ _id: req.params.id, school_id });
        res.json({ message: 'Category removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


// --- FEE STRUCTURE MANAGEMENT ---
const getFeeStructures = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const structures = await FeeStructure.find({ school_id })
            .populate('class_id', 'class section')
            .populate('items.category_id', 'name code');
        res.json(structures);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const createFeeStructure = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { class_id, academic_year, items, status } = req.body;

        const exists = await FeeStructure.findOne({ school_id, class_id, academic_year });
        if (exists) {
            return res.status(400).json({ message: 'Structure already configured for this class' });
        }

        const structure = await FeeStructure.create({
            school_id, class_id, academic_year, items, status
        });
        res.status(201).json(structure);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateFeeStructure = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const structure = await FeeStructure.findOneAndUpdate(
            { _id: req.params.id, school_id },
            req.body,
            { new: true }
        );
        res.json(structure);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteFeeStructure = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        await FeeStructure.findOneAndDelete({ _id: req.params.id, school_id });
        res.json({ message: 'Structure deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


// --- STUDENT FEE ASSIGNMENT ---
const getStudentFeesList = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { class_id, academic_year } = req.query;

        if (!class_id || !academic_year) {
            return res.status(400).json({ message: 'Class and Academic Year parameters are required' });
        }

        const students = await Student.find({ school_id, class_id }).populate('class_id', 'class section');
        const assignedFees = await StudentFee.find({ school_id, class_id, academic_year });

        const studentsList = students.map(student => {
            const assigned = assignedFees.find(f => f.student_id.toString() === student._id.toString());
            return {
                student,
                assigned: assigned || null
            };
        });

        res.json(studentsList);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const assignStudentFee = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { student_id, class_id, academic_year, items } = req.body;

        const fee = await StudentFee.findOneAndUpdate(
            { school_id, student_id, academic_year },
            { school_id, student_id, class_id, academic_year, items },
            { new: true, upsert: true }
        );
        res.json(fee);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const bulkAssignStudentFee = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { class_id, academic_year, structure_id } = req.body;

        const structure = await FeeStructure.findOne({ _id: structure_id, school_id });
        if (!structure) {
            return res.status(404).json({ message: 'Fee Structure configuration not found' });
        }

        const students = await Student.find({ school_id, class_id });
        const items = structure.items.map(i => ({
            category_id: i.category_id,
            amount: i.amount,
            due_date: i.due_date,
            fine_type: i.fine_type,
            fine_amount: i.fine_amount,
            paid_amount: 0,
            fine_calculated: 0,
            discount_amount: 0,
            status: 'Unpaid'
        }));

        for (const student of students) {
            await StudentFee.findOneAndUpdate(
                { school_id, student_id: student._id, academic_year },
                { school_id, student_id: student._id, class_id, academic_year, items },
                { upsert: true }
            );
        }

        res.json({ message: `Fees structure successfully assigned to ${students.length} students` });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


// --- DISCOUNT MANAGEMENT ---
const getFeeDiscounts = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const discounts = await FeeDiscount.find({ school_id });
        res.json(discounts);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const createFeeDiscount = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { name, type, amount, reason, status } = req.body;
        const exists = await FeeDiscount.findOne({ school_id, name });
        if (exists) {
            return res.status(400).json({ message: 'Discount scheme already exists' });
        }
        const discount = await FeeDiscount.create({
            school_id, name, type, amount, reason, status
        });
        res.status(201).json(discount);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateFeeDiscount = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const discount = await FeeDiscount.findOneAndUpdate(
            { _id: req.params.id, school_id },
            req.body,
            { new: true }
        );
        res.json(discount);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteFeeDiscount = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        await FeeDiscount.findOneAndDelete({ _id: req.params.id, school_id });
        res.json({ message: 'Discount scheme deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


// --- FEE COLLECTION ---
const searchStudentForFee = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { query, class_id, academic_year } = req.query;

        if (!academic_year) {
            return res.status(400).json({ message: 'Academic Year is required' });
        }

        const studentFilter = { school_id };
        if (class_id) studentFilter.class_id = class_id;

        if (query) {
            studentFilter.$or = [
                { student_name: { $regex: query, $options: 'i' } },
                { admission_number: { $regex: query, $options: 'i' } },
                { parent_phone: { $regex: query, $options: 'i' } }
            ];
        }

        const students = await Student.find(studentFilter).populate('class_id', 'class section');
        const studentIds = students.map(s => s._id);

        const fees = await StudentFee.find({ school_id, student_id: { $in: studentIds }, academic_year })
            .populate('items.category_id', 'name code');

        // Map and pre-calculate fine for overdue due-dates
        const result = students.map(student => {
            const f = fees.find(fee => fee.student_id.toString() === student._id.toString());
            
            if (!f) {
                return {
                    _id: `temp_${student._id}`,
                    student,
                    academic_year,
                    items: [],
                    refunds: []
                };
            }

            // Auto Calculate Overdue Fine
            const updatedItems = f.items.map(item => {
                let fine = 0;
                const dueDate = new Date(item.due_date);
                const today = new Date();
                
                if (today > dueDate && item.status !== 'Paid') {
                    const diffTime = Math.abs(today - dueDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (item.fine_type === 'Daily') {
                        fine = diffDays * item.fine_amount;
                    } else if (item.fine_type === 'Weekly') {
                        fine = Math.ceil(diffDays / 7) * item.fine_amount;
                    } else if (item.fine_type === 'Fixed') {
                        fine = item.fine_amount;
                    }
                }
                item.fine_calculated = fine;
                return item;
            });

            return {
                _id: f._id,
                student,
                academic_year: f.academic_year,
                items: updatedItems,
                refunds: f.refunds
            };
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const collectStudentFee = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { student_id, academic_year, payment_method, notes, items_payment, transaction_id } = req.body;

        const fee = await StudentFee.findOne({ school_id, student_id, academic_year });
        if (!fee) {
            return res.status(404).json({ message: 'Assigned Student Fees record not found' });
        }

        let totalPaid = 0;
        const breakdown = [];

        // Update items payment status
        fee.items = fee.items.map(item => {
            const payInfo = items_payment.find(p => p.category_id.toString() === item.category_id.toString());
            if (payInfo) {
                const collectAmt = parseFloat(payInfo.amount_to_pay) || 0;
                const fineAmt = parseFloat(payInfo.fine_to_pay) || 0;
                
                item.paid_amount += collectAmt;
                item.fine_calculated = fineAmt; // snapshot active fine
                
                if (item.paid_amount >= (item.amount - item.discount_amount)) {
                    item.status = 'Paid';
                } else if (item.paid_amount > 0) {
                    item.status = 'Partial';
                }
                
                totalPaid += collectAmt + fineAmt;
                breakdown.push({
                    category_id: item.category_id,
                    amount: collectAmt,
                    fine_paid: fineAmt,
                    discount_applied: item.discount_amount
                });
            }
            return item;
        });

        await fee.save();

        // Generate receipt
        const receiptCount = await FeePayment.countDocuments({ school_id });
        const receiptNumber = `REC-${selectedYearShort()}${10001 + receiptCount}`;

        const payment = await FeePayment.create({
            school_id,
            student_id,
            receipt_number: receiptNumber,
            amount_paid: totalPaid,
            payment_method,
            transaction_id: transaction_id || '',
            notes: notes || '',
            payment_status: 'Completed',
            breakdown
        });

        res.status(201).json({ payment, fee, message: 'Fees collected successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const selectedYearShort = () => {
    return new Date().getFullYear().toString().substring(2);
};


// --- ONLINE RAZORPAY INTEGRATION SIMULATION ---
const createRazorpayOrder = async (req, res) => {
    try {
        const { amount } = req.body;
        // Simulate order creation return
        const orderId = `order_${Math.random().toString(36).substring(2, 15)}`;
        res.json({
            id: orderId,
            amount: amount * 100, // in paisa
            currency: 'INR',
            key: 'rzp_test_mockkey'
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const verifyRazorpayPayment = async (req, res) => {
    try {
        const { student_id, academic_year, payment_method, notes, items_payment, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const student = await Student.findById(student_id);
        if (!student) return res.status(404).json({ message: 'Student not found' });
        const school_id = student.school_id;

        const fee = await StudentFee.findOne({ school_id, student_id, academic_year });
        if (!fee) return res.status(404).json({ message: 'Fees not found' });

        let totalPaid = 0;
        const breakdown = [];

        fee.items = fee.items.map(item => {
            const payInfo = items_payment.find(p => p.category_id.toString() === item.category_id.toString());
            if (payInfo) {
                const collectAmt = parseFloat(payInfo.amount_to_pay) || 0;
                const fineAmt = parseFloat(payInfo.fine_to_pay) || 0;
                
                item.paid_amount += collectAmt;
                item.fine_calculated = fineAmt;
                
                if (item.paid_amount >= (item.amount - item.discount_amount)) {
                    item.status = 'Paid';
                } else if (item.paid_amount > 0) {
                    item.status = 'Partial';
                }
                
                totalPaid += collectAmt + fineAmt;
                breakdown.push({
                    category_id: item.category_id,
                    amount: collectAmt,
                    fine_paid: fineAmt,
                    discount_applied: item.discount_amount
                });
            }
            return item;
        });

        await fee.save();

        const receiptCount = await FeePayment.countDocuments({ school_id });
        const receiptNumber = `REC-${selectedYearShort()}${10001 + receiptCount}`;

        const payment = await FeePayment.create({
            school_id,
            student_id,
            receipt_number: receiptNumber,
            amount_paid: totalPaid,
            payment_method,
            transaction_id: razorpay_payment_id,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            notes: notes || 'Online Self-Checkout Payment',
            payment_status: 'Completed',
            breakdown
        });

        res.status(201).json({ payment, fee, message: 'Online Payment verified successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


// --- REFUND MANAGEMENT ---
const requestRefund = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { student_id, academic_year, amount, reason } = req.body;

        const fee = await StudentFee.findOne({ school_id, student_id, academic_year });
        if (!fee) return res.status(404).json({ message: 'Student Fee record not found' });

        fee.refunds.push({
            amount,
            reason,
            date: new Date(),
            status: 'Pending',
            ref_no: `REF-${Math.floor(Math.random() * 90000) + 10000}`
        });

        await fee.save();
        res.json({ fee, message: 'Refund request submitted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getRefundsList = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const fees = await StudentFee.find({ school_id, 'refunds.0': { $exists: true } })
            .populate('student_id', 'student_name admission_number')
            .populate('class_id', 'class section');

        const refunds = [];
        fees.forEach(f => {
            f.refunds.forEach(ref => {
                refunds.push({
                    student_fee_id: f._id,
                    refund_id: ref._id,
                    student: f.student_id,
                    class: f.class_id,
                    amount: ref.amount,
                    reason: ref.reason,
                    date: ref.date,
                    status: ref.status,
                    ref_no: ref.ref_no
                });
            });
        });

        res.json(refunds);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateRefundStatus = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { student_fee_id, refund_id, status } = req.body;

        const fee = await StudentFee.findOne({ _id: student_fee_id, school_id });
        if (!fee) return res.status(404).json({ message: 'Student Fee record not found' });

        const refund = fee.refunds.id(refund_id);
        if (!refund) return res.status(404).json({ message: 'Refund details not found' });

        refund.status = status;
        await fee.save();

        res.json({ fee, message: 'Refund status updated successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


// --- REPORTS & ANALYTICS ---
const getFeeReports = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { type, month, year, date, class_id } = req.query;

        const filter = { school_id };

        if (type === 'Daily' && date) {
            const start = new Date(date);
            start.setUTCHours(0,0,0,0);
            const end = new Date(date);
            end.setUTCHours(23,59,59,999);
            filter.payment_date = { $gte: start, $lte: end };
        } else if (type === 'Monthly' && month && year) {
            const start = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, 1, 0,0,0,0));
            const end = new Date(Date.UTC(parseInt(year), parseInt(month), 0, 23,59,59,999));
            filter.payment_date = { $gte: start, $lte: end };
        }

        const payments = await FeePayment.find(filter)
            .populate('student_id', 'student_name admission_number class_id')
            .sort({ payment_date: -1 });

        let result = payments;

        // Apply class filter if provided
        if (class_id) {
            result = payments.filter(p => p.student_id?.class_id?.toString() === class_id.toString());
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getFeeDashboardStats = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);

        const allPayments = await FeePayment.find({ school_id });
        const totalCollection = allPayments.reduce((sum, p) => sum + p.amount_paid, 0);

        // Today's collection
        const start = new Date();
        start.setHours(0,0,0,0);
        const todayCollection = allPayments
            .filter(p => new Date(p.payment_date) >= start)
            .reduce((sum, p) => sum + p.amount_paid, 0);

        // Pending Fees
        const studentFees = await StudentFee.find({ school_id });
        let pendingFees = 0;
        let totalDiscounts = 0;
        let totalRefunds = 0;

        studentFees.forEach(f => {
            f.items.forEach(i => {
                const net = i.amount - i.discount_amount;
                const pend = net - i.paid_amount;
                if (pend > 0) pendingFees += pend;
                totalDiscounts += i.discount_amount;
            });
            f.refunds.forEach(ref => {
                if (ref.status === 'Completed' || ref.status === 'Approved') {
                    totalRefunds += ref.amount;
                }
            });
        });

        res.json({
            totalCollection,
            todayCollection,
            pendingFees,
            totalRefunds,
            totalDiscounts,
            monthlyRevenue: totalCollection
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getParentFees = async (req, res) => {
    try {
        const students = await Student.find({ parent_user_id: req.user._id });
        const studentIds = students.map(s => s._id);

        const fees = await StudentFee.find({ student_id: { $in: studentIds } })
            .populate('items.category_id', 'name code')
            .populate('student_id', 'student_name admission_number')
            .populate('class_id', 'class section');

        const result = fees.map(f => {
            const updatedItems = f.items.map(item => {
                let fine = 0;
                const dueDate = new Date(item.due_date);
                const today = new Date();
                
                if (today > dueDate && item.status !== 'Paid') {
                    const diffTime = Math.abs(today - dueDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (item.fine_type === 'Daily') {
                        fine = diffDays * item.fine_amount;
                    } else if (item.fine_type === 'Weekly') {
                        fine = Math.ceil(diffDays / 7) * item.fine_amount;
                    } else if (item.fine_type === 'Fixed') {
                        fine = item.fine_amount;
                    }
                }
                item.fine_calculated = fine;
                return item;
            });

            return {
                _id: f._id,
                student_id: f.student_id,
                class_id: f.class_id,
                academic_year: f.academic_year,
                items: updatedItems,
                refunds: f.refunds
            };
        });

        const payments = await FeePayment.find({ student_id: { $in: studentIds } })
            .populate('student_id', 'student_name admission_number')
            .sort({ payment_date: -1 });

        res.json({ fees: result, payments });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getFeeCategories,
    createFeeCategory,
    updateFeeCategory,
    deleteFeeCategory,
    getFeeStructures,
    createFeeStructure,
    updateFeeStructure,
    deleteFeeStructure,
    getStudentFeesList,
    assignStudentFee,
    bulkAssignStudentFee,
    getFeeDiscounts,
    createFeeDiscount,
    updateFeeDiscount,
    deleteFeeDiscount,
    searchStudentForFee,
    collectStudentFee,
    createRazorpayOrder,
    verifyRazorpayPayment,
    requestRefund,
    getRefundsList,
    updateRefundStatus,
    getFeeReports,
    getFeeDashboardStats,
    getParentFees
};
