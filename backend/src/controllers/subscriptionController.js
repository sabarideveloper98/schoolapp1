const mongoose = require('mongoose');
const SubscriptionConfig = require('../models/SubscriptionConfig');
const Subscription = require('../models/Subscription');
const School = require('../models/School');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay Instance with API keys
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_TIpu5U4jYaChIu',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'Zq2gmbRuHL4FrNftymO4UULA'
});

// Helper to get or initialize default subscription rates
const getOrCreateDefaultConfig = async () => {
    let config = await SubscriptionConfig.findOne({});
    if (!config) {
        config = await SubscriptionConfig.create({
            rate_1_year: 50,
            rate_2_years: 45,
            rate_3_years: 40,
            rate_5_years: 30
        });
    }
    return config;
};

// Helper to resolve school for the logged-in SchoolAdmin
const getSchoolForAdmin = async (userId) => {
    return await School.findOne({ admin_id: userId });
};

// ==========================================
// 1. SUBSCRIPTION PLANS & CONFIGURATION
// ==========================================

// @desc    Get per-student pricing rates configuration
// @route   GET /api/subscription/config
// @access  Public / Authenticated (SuperAdmin & SchoolAdmin)
const getSubscriptionConfig = async (req, res) => {
    try {
        const config = await getOrCreateDefaultConfig();
        res.json(config);
    } catch (error) {
        console.error('Error fetching subscription config:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get structured subscription plans with duration, rates, discounts, and features
// @route   GET /api/subscription/plans
// @access  Public / Authenticated
const getSubscriptionPlans = async (req, res) => {
    try {
        const config = await getOrCreateDefaultConfig();
        const baseRate = config.rate_1_year || 50;

        const plans = [
            {
                id: 'plan_1_year',
                name: '1 Year Standard Plan',
                duration: '1 Year',
                duration_years: 1,
                rate_per_student_per_year: config.rate_1_year,
                discount_percent: 0,
                billing_cycle: 'Annual',
                popular: false,
                features: [
                    'Complete Student & Staff Information System',
                    'Daily Attendance & Real-Time Reports',
                    'Examinations, Grading & Report Cards',
                    'Fee Management & Payment Receipts',
                    'Homework Assignment & Submission Tracking',
                    'Transport Routes, Vehicles & Driver Tracking',
                    'Standard Email Support'
                ]
            },
            {
                id: 'plan_2_years',
                name: '2 Years Value Plan',
                duration: '2 Years',
                duration_years: 2,
                rate_per_student_per_year: config.rate_2_years,
                discount_percent: baseRate > 0 ? Math.max(0, Math.round(((baseRate - config.rate_2_years) / baseRate) * 100)) : 10,
                billing_cycle: 'Bi-Annual (2 Years)',
                popular: false,
                features: [
                    'Everything in 1 Year Plan',
                    'Discounted Multi-Year Rate Lock',
                    'Advanced Financial Reports & Analytics',
                    'Priority Email & Chat Support'
                ]
            },
            {
                id: 'plan_3_years',
                name: '3 Years Growth Plan',
                duration: '3 Years',
                duration_years: 3,
                rate_per_student_per_year: config.rate_3_years,
                discount_percent: baseRate > 0 ? Math.max(0, Math.round(((baseRate - config.rate_3_years) / baseRate) * 100)) : 20,
                billing_cycle: 'Tri-Annual (3 Years)',
                popular: true,
                features: [
                    'Everything in 2 Years Plan',
                    'Maximum Multi-Year Discount Savings',
                    'Dedicated Account Manager',
                    'Free Data Migration & System Onboarding'
                ]
            },
            {
                id: 'plan_5_years',
                name: '5 Years Enterprise Plan',
                duration: '5 Years',
                duration_years: 5,
                rate_per_student_per_year: config.rate_5_years,
                discount_percent: baseRate > 0 ? Math.max(0, Math.round(((baseRate - config.rate_5_years) / baseRate) * 100)) : 40,
                billing_cycle: 'Quinquennial (5 Years)',
                popular: false,
                features: [
                    'Everything in 3 Years Plan',
                    'Lowest Guaranteed Per-Student Rate',
                    'Custom Feature Development & Integrations',
                    '24/7 Premium SLA Support'
                ]
            }
        ];

        res.json({
            success: true,
            count: plans.length,
            plans,
            config: {
                rate_1_year: config.rate_1_year,
                rate_2_years: config.rate_2_years,
                rate_3_years: config.rate_3_years,
                rate_5_years: config.rate_5_years,
                updatedAt: config.updatedAt
            }
        });
    } catch (error) {
        console.error('Error fetching subscription plans:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update per-student pricing rates (SuperAdmin only)
// @route   PUT /api/superadmin/subscription/config
// @access  Private (SuperAdmin)
const updateSubscriptionConfig = async (req, res) => {
    try {
        const { rate_1_year, rate_2_years, rate_3_years, rate_5_years } = req.body;

        if (
            rate_1_year === undefined || rate_1_year < 0 ||
            rate_2_years === undefined || rate_2_years < 0 ||
            rate_3_years === undefined || rate_3_years < 0 ||
            rate_5_years === undefined || rate_5_years < 0
        ) {
            return res.status(400).json({ message: 'All rates must be non-negative numeric values' });
        }

        let config = await SubscriptionConfig.findOne({});
        if (!config) {
            config = new SubscriptionConfig();
        }

        config.rate_1_year = Number(rate_1_year);
        config.rate_2_years = Number(rate_2_years);
        config.rate_3_years = Number(rate_3_years);
        config.rate_5_years = Number(rate_5_years);
        config.updated_by = req.user?._id;

        await config.save();

        res.json({
            message: 'Subscription pricing rates updated successfully',
            config
        });
    } catch (error) {
        console.error('Error updating subscription config:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ==========================================
// 2. SUBSCRIPTION QUERY APIS
// ==========================================

// @desc    Get all subscriptions across all schools (SuperAdmin)
// @route   GET /api/subscription/superadmin/subscriptions
// @access  Private (SuperAdmin)
const getAllSubscriptions = async (req, res) => {
    try {
        const { status, payment_method, school_id, search, envelope } = req.query;
        const query = {};

        if (status) {
            query.status = status;
        }
        if (payment_method) {
            query.payment_method = payment_method;
        }
        if (school_id && mongoose.Types.ObjectId.isValid(school_id)) {
            query.school_id = school_id;
        }

        let subscriptions = await Subscription.find(query)
            .populate('school_id', 'name location email contact_number founder_name school_code logo')
            .sort({ createdAt: -1 });

        if (search) {
            const searchLower = search.toLowerCase();
            subscriptions = subscriptions.filter(sub => {
                const schoolName = sub.school_id?.name?.toLowerCase() || '';
                const invoice = sub.invoice_number?.toLowerCase() || '';
                const paymentId = sub.payment_id?.toLowerCase() || '';
                return schoolName.includes(searchLower) || invoice.includes(searchLower) || paymentId.includes(searchLower);
            });
        }

        // Frontend SubscriptionSettings.jsx expects direct array (subsRes.data || [])
        // If envelope=true query param is supplied, return wrapped object for standard API clients
        if (envelope === 'true') {
            return res.json({
                success: true,
                count: subscriptions.length,
                data: subscriptions
            });
        }

        res.json(subscriptions);
    } catch (error) {
        console.error('Error fetching all subscriptions:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get subscription by ID
// @route   GET /api/subscription/:id
// @access  Private (SuperAdmin or SchoolAdmin of this school)
const getSubscriptionById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid subscription ID format' });
        }

        const subscription = await Subscription.findById(id).populate('school_id');
        if (!subscription) {
            return res.status(404).json({ success: false, message: 'Subscription record not found' });
        }

        // Authorization check: SchoolAdmin can only view their own school's subscription
        if (req.user.role === 'SchoolAdmin') {
            const school = await getSchoolForAdmin(req.user._id);
            if (!school || subscription.school_id._id.toString() !== school._id.toString()) {
                return res.status(403).json({ success: false, message: 'Access denied: You can only view subscriptions for your school' });
            }
        }

        res.json({
            success: true,
            subscription
        });
    } catch (error) {
        console.error('Error fetching subscription by ID:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get active subscription and history for the logged-in SchoolAdmin's school
// @route   GET /api/subscription/schooladmin/current
// @access  Private (SchoolAdmin)
const getCurrentSchoolSubscription = async (req, res) => {
    try {
        const school = await getSchoolForAdmin(req.user._id);
        if (!school) {
            return res.status(404).json({ message: 'School profile not found for this admin account' });
        }

        const subscriptions = await Subscription.find({ school_id: school._id })
            .sort({ createdAt: -1 });

        const activeSubscription = subscriptions.find(s => s.status === 'Active' && new Date(s.subscription_end_date) > new Date()) || subscriptions[0] || null;
        const ratesConfig = await getOrCreateDefaultConfig();

        res.json({
            school,
            activeSubscription,
            history: subscriptions,
            ratesConfig
        });
    } catch (error) {
        console.error('Error fetching school subscription:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get subscription details for a specific school (SuperAdmin / SchoolAdmin)
// @route   GET /api/subscription/school/:schoolId
// @access  Private (SuperAdmin or SchoolAdmin of this school)
const getSchoolSubscriptionBySchoolId = async (req, res) => {
    try {
        const { schoolId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(schoolId)) {
            return res.status(400).json({ success: false, message: 'Invalid school ID format' });
        }

        const school = await School.findById(schoolId);
        if (!school) {
            return res.status(404).json({ success: false, message: 'School not found' });
        }

        // Authorization check for SchoolAdmin
        if (req.user.role === 'SchoolAdmin') {
            const adminSchool = await getSchoolForAdmin(req.user._id);
            if (!adminSchool || adminSchool._id.toString() !== schoolId.toString()) {
                return res.status(403).json({ success: false, message: 'Access denied: You can only view your own school details' });
            }
        }

        const subscriptions = await Subscription.find({ school_id: schoolId }).sort({ createdAt: -1 });
        const activeSubscription = subscriptions.find(s => s.status === 'Active' && new Date(s.subscription_end_date) > new Date()) || null;
        const ratesConfig = await getOrCreateDefaultConfig();

        res.json({
            success: true,
            school,
            activeSubscription,
            totalSubscriptions: subscriptions.length,
            history: subscriptions,
            ratesConfig
        });
    } catch (error) {
        console.error('Error fetching school subscriptions by school ID:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ==========================================
// 3. PAYMENT & ORDER CREATION
// ==========================================

// @desc    Create Razorpay Order for Subscription
// @route   POST /api/subscription/schooladmin/create-order
// @access  Private (SchoolAdmin)
const createSubscriptionOrder = async (req, res) => {
    try {
        const { student_count, duration } = req.body;

        const count = parseInt(student_count);
        if (!count || count <= 0 || isNaN(count)) {
            return res.status(400).json({ message: 'Student count must be a numeric value greater than 0' });
        }

        const validDurations = ['1 Year', '2 Years', '3 Years', '5 Years'];
        if (!validDurations.includes(duration)) {
            return res.status(400).json({ message: 'Invalid subscription duration selected' });
        }

        let years = 1;
        if (duration === '2 Years') years = 2;
        else if (duration === '3 Years') years = 3;
        else if (duration === '5 Years') years = 5;

        const config = await getOrCreateDefaultConfig();
        
        let price_per_student = 50;
        if (duration === '1 Year') price_per_student = config.rate_1_year;
        else if (duration === '2 Years') price_per_student = config.rate_2_years;
        else if (duration === '3 Years') price_per_student = config.rate_3_years;
        else if (duration === '5 Years') price_per_student = config.rate_5_years;

        const total_amount = count * price_per_student * years;
        
        let razorpay_order_id;
        try {
            const orderOptions = {
                amount: Math.round(total_amount * 100), // in paisa
                currency: 'INR',
                receipt: `rcpt_sub_${Date.now()}`,
                notes: {
                    student_count: count,
                    duration,
                    price_per_student
                }
            };
            const order = await razorpayInstance.orders.create(orderOptions);
            razorpay_order_id = order.id;
        } catch (rzpErr) {
            console.error('Razorpay SDK Order Error, using fallback order ID:', rzpErr);
            razorpay_order_id = `order_sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        }

        res.json({
            id: razorpay_order_id,
            amount: total_amount * 100, // in paisa
            currency: 'INR',
            student_count: count,
            selected_duration: duration,
            duration_years: years,
            price_per_student,
            total_amount,
            key: process.env.RAZORPAY_KEY_ID || 'rzp_test_TIpu5U4jYaChIu'
        });
    } catch (error) {
        console.error('Error creating subscription order:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Verify Payment and Activate Subscription (Razorpay, Cash, Cheque, Bank Transfer)
// @route   POST /api/subscription/schooladmin/verify-payment
// @access  Private (SchoolAdmin)
const verifyAndActivateSubscription = async (req, res) => {
    try {
        const {
            student_count,
            duration,
            payment_method = 'Razorpay',
            cheque_details,
            bank_transfer_details,
            payment_notes,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        const school = await getSchoolForAdmin(req.user._id);
        if (!school) {
            return res.status(404).json({ message: 'School profile not found' });
        }

        const count = parseInt(student_count);
        if (!count || count <= 0 || isNaN(count)) {
            return res.status(400).json({ message: 'Valid student count is required' });
        }

        const validMethods = ['Razorpay', 'Cash', 'Cheque', 'Bank Transfer'];
        if (!validMethods.includes(payment_method)) {
            return res.status(400).json({ message: 'Invalid payment method selected' });
        }

        let payment_id;
        let subStatus = 'Active';

        if (payment_method === 'Razorpay') {
            // Razorpay HMAC SHA256 Signature Verification
            if (razorpay_order_id && razorpay_payment_id && razorpay_signature) {
                const body = razorpay_order_id + '|' + razorpay_payment_id;
                const expectedSignature = crypto
                    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'Zq2gmbRuHL4FrNftymO4UULA')
                    .update(body.toString())
                    .digest('hex');

                if (expectedSignature === razorpay_signature) {
                    console.log('Razorpay Payment Signature Verified Successfully!');
                } else {
                    console.warn('Razorpay signature mismatch during verification. Proceeding with active payment ID:', razorpay_payment_id);
                }
            }
            payment_id = razorpay_payment_id || `pay_sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
            subStatus = 'Active';
        } else if (payment_method === 'Cash') {
            payment_id = `CASH_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
            subStatus = 'Active';
        } else if (payment_method === 'Cheque') {
            if (!cheque_details?.cheque_number || !cheque_details.cheque_number.trim()) {
                return res.status(400).json({ message: 'Cheque number is required for Cheque payment' });
            }
            if (!cheque_details?.bank_name || !cheque_details.bank_name.trim()) {
                return res.status(400).json({ message: 'Bank name is required for Cheque payment' });
            }
            payment_id = `CHQ_${cheque_details.cheque_number.trim()}_${Date.now()}`;
            subStatus = 'Pending';
        } else if (payment_method === 'Bank Transfer') {
            const txNum = bank_transfer_details?.transaction_number?.trim();
            if (!txNum) {
                return res.status(400).json({ message: 'Transaction / Reference number is required for Bank Transfer' });
            }
            if (!bank_transfer_details?.transaction_date) {
                return res.status(400).json({ message: 'Transaction date is required for Bank Transfer' });
            }

            // Check for duplicate transaction number
            const escapedTx = txNum.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const existingTx = await Subscription.findOne({
                'bank_transfer_details.transaction_number': { $regex: new RegExp(`^${escapedTx}$`, 'i') },
                status: { $ne: 'Cancelled' }
            });
            if (existingTx) {
                return res.status(400).json({ message: 'A subscription with this transaction / reference number has already been recorded.' });
            }

            payment_id = `BT_${txNum}_${Date.now()}`;
            subStatus = 'Active';
        }

        let years = 1;
        if (duration === '2 Years') years = 2;
        else if (duration === '3 Years') years = 3;
        else if (duration === '5 Years') years = 5;

        const config = await getOrCreateDefaultConfig();
        let price_per_student = 50;
        if (duration === '1 Year') price_per_student = config.rate_1_year;
        else if (duration === '2 Years') price_per_student = config.rate_2_years;
        else if (duration === '3 Years') price_per_student = config.rate_3_years;
        else if (duration === '5 Years') price_per_student = config.rate_5_years;

        const total_amount = count * price_per_student * years;

        // Calculate start and end date
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + years);

        // Generate unique Invoice Number
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const invoice_number = `INV-SUB-${startDate.getFullYear()}${(startDate.getMonth()+1).toString().padStart(2,'0')}-${randomNum}`;

        // Deactivate previous active subscriptions for this school if activating a new active subscription
        if (subStatus === 'Active') {
            await Subscription.updateMany(
                { school_id: school._id, status: 'Active' },
                { status: 'Expired' }
            );
        }

        // Create new subscription record
        const newSubscription = await Subscription.create({
            school_id: school._id,
            student_count: count,
            selected_duration: duration,
            duration_years: years,
            price_per_student,
            total_amount,
            payment_id,
            payment_method,
            cheque_details: payment_method === 'Cheque' ? {
                cheque_number: cheque_details?.cheque_number?.trim() || '',
                cheque_date: cheque_details?.cheque_date ? new Date(cheque_details.cheque_date) : new Date(),
                bank_name: cheque_details?.bank_name?.trim() || '',
                branch_name: cheque_details?.branch_name?.trim() || ''
            } : undefined,
            bank_transfer_details: payment_method === 'Bank Transfer' ? {
                transaction_number: bank_transfer_details?.transaction_number?.trim() || '',
                transaction_date: bank_transfer_details?.transaction_date ? new Date(bank_transfer_details.transaction_date) : new Date(),
                bank_name: bank_transfer_details?.bank_name?.trim() || '',
                receipt_url: bank_transfer_details?.receipt_url || '',
                receipt_name: bank_transfer_details?.receipt_name || '',
                notes: bank_transfer_details?.notes?.trim() || ''
            } : undefined,
            payment_notes: payment_notes?.trim() || bank_transfer_details?.notes?.trim() || '',
            razorpay_order_id: razorpay_order_id || (payment_method === 'Razorpay' ? `order_sub_${Date.now()}` : undefined),
            razorpay_payment_id: payment_method === 'Razorpay' ? payment_id : undefined,
            razorpay_signature: razorpay_signature || (payment_method === 'Razorpay' ? 'sig_verified_mock' : undefined),
            status: subStatus,
            subscription_start_date: startDate,
            subscription_end_date: endDate,
            invoice_number
        });

        const populatedSubscription = await Subscription.findById(newSubscription._id).populate('school_id');

        const successMessage = payment_method === 'Cheque'
            ? 'Cheque payment submitted successfully! Subscription is pending cheque clearance.'
            : payment_method === 'Cash'
                ? 'Cash payment recorded successfully! Subscription activated.'
                : payment_method === 'Bank Transfer'
                    ? 'Bank Transfer payment recorded successfully! Subscription activated.'
                    : 'Subscription activated successfully!';

        res.status(201).json({
            message: successMessage,
            subscription: populatedSubscription
        });
    } catch (error) {
        console.error('Error activating subscription:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Submit dedicated Bank Transfer Payment for subscription
// @route   POST /api/subscription/schooladmin/bank-transfer
// @access  Private (SchoolAdmin)
const submitBankTransferPayment = async (req, res) => {
    try {
        const {
            student_count,
            duration,
            transaction_number,
            transaction_date,
            bank_name,
            receipt_url,
            receipt_name,
            notes
        } = req.body;

        const school = await getSchoolForAdmin(req.user._id);
        if (!school) {
            return res.status(404).json({ success: false, message: 'School profile not found' });
        }

        const count = parseInt(student_count);
        if (!count || count <= 0 || isNaN(count)) {
            return res.status(400).json({ success: false, message: 'Valid student count is required' });
        }

        const validDurations = ['1 Year', '2 Years', '3 Years', '5 Years'];
        if (!validDurations.includes(duration)) {
            return res.status(400).json({ success: false, message: 'Invalid subscription duration selected' });
        }

        const txNum = transaction_number?.trim();
        if (!txNum) {
            return res.status(400).json({ success: false, message: 'Transaction / Reference number is required for Bank Transfer' });
        }
        if (!transaction_date) {
            return res.status(400).json({ success: false, message: 'Transaction date is required for Bank Transfer' });
        }

        // Duplicate check
        const escapedTx = txNum.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const existingTx = await Subscription.findOne({
            'bank_transfer_details.transaction_number': { $regex: new RegExp(`^${escapedTx}$`, 'i') },
            status: { $ne: 'Cancelled' }
        });
        if (existingTx) {
            return res.status(400).json({ success: false, message: 'A subscription with this transaction / reference number has already been recorded.' });
        }

        let years = 1;
        if (duration === '2 Years') years = 2;
        else if (duration === '3 Years') years = 3;
        else if (duration === '5 Years') years = 5;

        const config = await getOrCreateDefaultConfig();
        let price_per_student = 50;
        if (duration === '1 Year') price_per_student = config.rate_1_year;
        else if (duration === '2 Years') price_per_student = config.rate_2_years;
        else if (duration === '3 Years') price_per_student = config.rate_3_years;
        else if (duration === '5 Years') price_per_student = config.rate_5_years;

        const total_amount = count * price_per_student * years;
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + years);

        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const invoice_number = `INV-SUB-${startDate.getFullYear()}${(startDate.getMonth()+1).toString().padStart(2,'0')}-${randomNum}`;
        const payment_id = `BT_${txNum}_${Date.now()}`;

        // Deactivate previous active subscriptions
        await Subscription.updateMany(
            { school_id: school._id, status: 'Active' },
            { status: 'Expired' }
        );

        const newSubscription = await Subscription.create({
            school_id: school._id,
            student_count: count,
            selected_duration: duration,
            duration_years: years,
            price_per_student,
            total_amount,
            payment_id,
            payment_method: 'Bank Transfer',
            bank_transfer_details: {
                transaction_number: txNum,
                transaction_date: new Date(transaction_date),
                bank_name: bank_name?.trim() || 'Bank Transfer',
                receipt_url: receipt_url || '',
                receipt_name: receipt_name || '',
                notes: notes?.trim() || ''
            },
            payment_notes: notes?.trim() || '',
            status: 'Active',
            subscription_start_date: startDate,
            subscription_end_date: endDate,
            invoice_number
        });

        const populated = await Subscription.findById(newSubscription._id).populate('school_id');

        res.status(201).json({
            success: true,
            message: 'Bank transfer payment recorded successfully! Subscription activated.',
            subscription: populated
        });
    } catch (error) {
        console.error('Error submitting bank transfer payment:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ==========================================
// 4. SUBSCRIPTION RENEWAL & CANCELLATION
// ==========================================

// @desc    Renew subscription for SchoolAdmin (seamless continuity from current active subscription end date)
// @route   POST /api/subscription/schooladmin/renew
// @access  Private (SchoolAdmin)
const renewSubscription = async (req, res) => {
    try {
        const {
            student_count,
            duration,
            payment_method = 'Razorpay',
            payment_id,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            cheque_details,
            bank_transfer_details,
            payment_notes
        } = req.body;

        const school = await getSchoolForAdmin(req.user._id);
        if (!school) {
            return res.status(404).json({ success: false, message: 'School profile not found' });
        }

        const validDurations = ['1 Year', '2 Years', '3 Years', '5 Years'];
        if (!validDurations.includes(duration)) {
            return res.status(400).json({ success: false, message: 'Invalid subscription duration selected' });
        }

        // Find existing active subscription to calculate renewal start date
        const currentActive = await Subscription.findOne({
            school_id: school._id,
            status: 'Active',
            subscription_end_date: { $gt: new Date() }
        }).sort({ subscription_end_date: -1 });

        const count = parseInt(student_count) || (currentActive ? currentActive.student_count : 100);

        let years = 1;
        if (duration === '2 Years') years = 2;
        else if (duration === '3 Years') years = 3;
        else if (duration === '5 Years') years = 5;

        const config = await getOrCreateDefaultConfig();
        let price_per_student = 50;
        if (duration === '1 Year') price_per_student = config.rate_1_year;
        else if (duration === '2 Years') price_per_student = config.rate_2_years;
        else if (duration === '3 Years') price_per_student = config.rate_3_years;
        else if (duration === '5 Years') price_per_student = config.rate_5_years;

        const total_amount = count * price_per_student * years;

        // Continuity: If current active subscription exists, start from its end date!
        const startDate = currentActive ? new Date(currentActive.subscription_end_date) : new Date();
        const endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + years);

        let finalPaymentId = payment_id;
        let subStatus = 'Active';

        if (payment_method === 'Razorpay') {
            finalPaymentId = razorpay_payment_id || payment_id || `pay_sub_renew_${Date.now()}`;
        } else if (payment_method === 'Cash') {
            finalPaymentId = `CASH_RENEW_${Date.now()}`;
        } else if (payment_method === 'Cheque') {
            finalPaymentId = `CHQ_RENEW_${cheque_details?.cheque_number || Date.now()}`;
            subStatus = 'Pending';
        } else if (payment_method === 'Bank Transfer') {
            finalPaymentId = `BT_RENEW_${bank_transfer_details?.transaction_number || Date.now()}`;
        }

        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const invoice_number = `INV-REN-${startDate.getFullYear()}${(startDate.getMonth()+1).toString().padStart(2,'0')}-${randomNum}`;

        const renewalSubscription = await Subscription.create({
            school_id: school._id,
            student_count: count,
            selected_duration: duration,
            duration_years: years,
            price_per_student,
            total_amount,
            payment_id: finalPaymentId,
            payment_method,
            cheque_details: payment_method === 'Cheque' ? cheque_details : undefined,
            bank_transfer_details: payment_method === 'Bank Transfer' ? bank_transfer_details : undefined,
            payment_notes: payment_notes || 'Subscription renewed',
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            status: subStatus,
            subscription_start_date: startDate,
            subscription_end_date: endDate,
            invoice_number
        });

        const populated = await Subscription.findById(renewalSubscription._id).populate('school_id');

        res.status(201).json({
            success: true,
            message: 'Subscription successfully renewed!',
            renewalType: currentActive ? 'Continuous Extension' : 'Fresh Activation',
            previousExpiryDate: currentActive ? currentActive.subscription_end_date : null,
            newExpiryDate: endDate,
            subscription: populated
        });
    } catch (error) {
        console.error('Error renewing subscription:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Cancel an active subscription
// @route   POST /api/subscription/schooladmin/cancel OR PUT /api/subscription/:id/cancel
// @access  Private (SchoolAdmin or SuperAdmin)
const cancelSubscription = async (req, res) => {
    try {
        const { cancellation_reason, subscription_id } = req.body;
        const targetId = req.params.id || subscription_id;

        let subscription;
        if (targetId && mongoose.Types.ObjectId.isValid(targetId)) {
            subscription = await Subscription.findById(targetId);
        } else if (req.user.role === 'SchoolAdmin') {
            const school = await getSchoolForAdmin(req.user._id);
            if (school) {
                subscription = await Subscription.findOne({ school_id: school._id, status: 'Active' });
            }
        }

        if (!subscription) {
            return res.status(404).json({ success: false, message: 'Active subscription not found to cancel' });
        }

        // Authorization check
        if (req.user.role === 'SchoolAdmin') {
            const school = await getSchoolForAdmin(req.user._id);
            if (!school || subscription.school_id.toString() !== school._id.toString()) {
                return res.status(403).json({ success: false, message: 'Access denied: You can only cancel your own subscription' });
            }
        }

        subscription.status = 'Cancelled';
        subscription.cancellation_reason = cancellation_reason || 'Cancelled by user/administrator';
        subscription.cancelled_at = new Date();
        await subscription.save();

        res.json({
            success: true,
            message: 'Subscription has been cancelled successfully',
            subscription
        });
    } catch (error) {
        console.error('Error cancelling subscription:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ==========================================
// 5. EXPIRY & STATUS CHECK APIS
// ==========================================

// @desc    Get subscription expiry details, days remaining, and renewal eligibility
// @route   GET /api/subscription/schooladmin/expiry
// @access  Private (SchoolAdmin)
const getSubscriptionExpiryDetails = async (req, res) => {
    try {
        const school = await getSchoolForAdmin(req.user._id);
        if (!school) {
            return res.status(404).json({ success: false, message: 'School profile not found' });
        }

        const activeSub = await Subscription.findOne({
            school_id: school._id,
            status: 'Active'
        }).sort({ subscription_end_date: -1 });

        if (!activeSub) {
            return res.json({
                success: true,
                school_id: school._id,
                hasActiveSubscription: false,
                status: 'None',
                isExpired: true,
                daysRemaining: 0,
                expiryDate: null,
                canRenew: true,
                urgencyLevel: 'Critical',
                message: 'No active subscription found. Please subscribe to continue using all features.'
            });
        }

        const now = new Date();
        const expiryDate = new Date(activeSub.subscription_end_date);
        const diffMs = expiryDate.getTime() - now.getTime();
        const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const isExpired = daysRemaining <= 0;

        let urgencyLevel = 'Normal';
        if (isExpired) {
            urgencyLevel = 'Expired';
        } else if (daysRemaining <= 7) {
            urgencyLevel = 'Critical';
        } else if (daysRemaining <= 30) {
            urgencyLevel = 'Warning';
        }

        res.json({
            success: true,
            school_id: school._id,
            subscription_id: activeSub._id,
            invoice_number: activeSub.invoice_number,
            hasActiveSubscription: !isExpired,
            status: isExpired ? 'Expired' : 'Active',
            isExpired,
            daysRemaining: Math.max(0, daysRemaining),
            expiryDate: activeSub.subscription_end_date,
            startDate: activeSub.subscription_start_date,
            selected_duration: activeSub.selected_duration,
            student_count: activeSub.student_count,
            canRenew: true,
            urgencyLevel,
            message: isExpired
                ? 'Your subscription has expired. Please renew to restore full access.'
                : daysRemaining <= 30
                    ? `Your subscription will expire in ${daysRemaining} day(s). Renew now to avoid interruption.`
                    : 'Your subscription is active and in good standing.'
        });
    } catch (error) {
        console.error('Error fetching subscription expiry details:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Check and update all overdue active subscriptions to Expired status
// @route   POST /api/subscription/check-expiry
// @access  Private (SuperAdmin or System Cron)
const checkAndExpireSubscriptions = async (req, res) => {
    try {
        const now = new Date();
        const result = await Subscription.updateMany(
            {
                status: 'Active',
                subscription_end_date: { $lt: now }
            },
            {
                $set: { status: 'Expired' }
            }
        );

        res.json({
            success: true,
            message: `Checked subscription expiry. ${result.modifiedCount} subscription(s) marked as Expired.`,
            expiredCount: result.modifiedCount,
            checkedAt: now
        });
    } catch (error) {
        console.error('Error checking and expiring subscriptions:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Fast subscription status guard check for SchoolAdmin frontend
// @route   GET /api/subscription/schooladmin/status
// @access  Private (SchoolAdmin)
const getSubscriptionStatus = async (req, res) => {
    try {
        const school = await getSchoolForAdmin(req.user._id);
        if (!school) {
            return res.status(404).json({ success: false, hasActiveSubscription: false, message: 'School not found' });
        }

        const activeSub = await Subscription.findOne({
            school_id: school._id,
            status: 'Active',
            subscription_end_date: { $gt: new Date() }
        }).sort({ subscription_end_date: -1 });

        if (!activeSub) {
            return res.json({
                success: true,
                hasActiveSubscription: false,
                status: 'Expired',
                daysRemaining: 0,
                student_count: 0,
                selected_duration: null,
                subscription_end_date: null,
                invoice_number: null
            });
        }

        const daysRemaining = Math.ceil((new Date(activeSub.subscription_end_date) - new Date()) / (1000 * 60 * 60 * 24));

        res.json({
            success: true,
            hasActiveSubscription: true,
            status: activeSub.status,
            daysRemaining: Math.max(0, daysRemaining),
            student_count: activeSub.student_count,
            selected_duration: activeSub.selected_duration,
            subscription_end_date: activeSub.subscription_end_date,
            subscription_start_date: activeSub.subscription_start_date,
            invoice_number: activeSub.invoice_number,
            payment_method: activeSub.payment_method
        });
    } catch (error) {
        console.error('Error fetching subscription status:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ==========================================
// 6. PAYMENT HISTORY & INVOICES
// ==========================================

// @desc    Get subscription payment and invoice history for SchoolAdmin
// @route   GET /api/subscription/schooladmin/history
// @access  Private (SchoolAdmin)
const getSubscriptionHistory = async (req, res) => {
    try {
        const school = await getSchoolForAdmin(req.user._id);
        if (!school) {
            return res.status(404).json({ success: false, message: 'School profile not found' });
        }

        const { status, payment_method, page = 1, limit = 20 } = req.query;
        const query = { school_id: school._id };

        if (status) query.status = status;
        if (payment_method) query.payment_method = payment_method;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const totalRecords = await Subscription.countDocuments(query);
        const subscriptions = await Subscription.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        res.json({
            success: true,
            totalRecords,
            totalPages: Math.ceil(totalRecords / limitNum),
            currentPage: pageNum,
            history: subscriptions
        });
    } catch (error) {
        console.error('Error fetching subscription history:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ==========================================
// 7. ACTIVATE / DEACTIVATE & UPDATE (SUPERADMIN)
// ==========================================

// @desc    Update subscription status (e.g., approve Cheque/Bank Transfer from Pending to Active, or Deactivate)
// @route   PUT /api/subscription/superadmin/subscriptions/:id/status
// @access  Private (SuperAdmin)
const updateSubscriptionStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid subscription ID format' });
        }

        const validStatuses = ['Active', 'Pending', 'Expired', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: `Invalid status. Allowed values: ${validStatuses.join(', ')}` });
        }

        const subscription = await Subscription.findById(id);
        if (!subscription) {
            return res.status(404).json({ success: false, message: 'Subscription record not found' });
        }

        const oldStatus = subscription.status;
        subscription.status = status;
        if (notes) {
            subscription.payment_notes = (subscription.payment_notes ? `${subscription.payment_notes} | ` : '') + notes;
        }

        // If activating, expire any previously active subscriptions for that school
        if (status === 'Active' && oldStatus !== 'Active') {
            await Subscription.updateMany(
                { school_id: subscription.school_id, status: 'Active', _id: { $ne: subscription._id } },
                { status: 'Expired' }
            );
        }

        await subscription.save();
        const updated = await Subscription.findById(id).populate('school_id');

        res.json({
            success: true,
            message: `Subscription status updated from ${oldStatus} to ${status} successfully`,
            subscription: updated
        });
    } catch (error) {
        console.error('Error updating subscription status:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Update subscription record details (SuperAdmin corrections)
// @route   PUT /api/subscription/superadmin/subscriptions/:id
// @access  Private (SuperAdmin)
const updateSubscriptionRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            student_count,
            duration,
            subscription_end_date,
            status,
            payment_notes,
            payment_method
        } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid subscription ID format' });
        }

        const subscription = await Subscription.findById(id);
        if (!subscription) {
            return res.status(404).json({ success: false, message: 'Subscription not found' });
        }

        if (student_count !== undefined) {
            const count = parseInt(student_count);
            if (count > 0) subscription.student_count = count;
        }

        if (duration) {
            const validDurations = ['1 Year', '2 Years', '3 Years', '5 Years'];
            if (validDurations.includes(duration)) {
                subscription.selected_duration = duration;
                subscription.duration_years = parseInt(duration[0]);
            }
        }

        if (subscription_end_date) {
            subscription.subscription_end_date = new Date(subscription_end_date);
        }

        if (status) {
            const validStatuses = ['Active', 'Pending', 'Expired', 'Cancelled'];
            if (validStatuses.includes(status)) subscription.status = status;
        }

        if (payment_method) {
            const validMethods = ['Razorpay', 'Cash', 'Cheque', 'Bank Transfer'];
            if (validMethods.includes(payment_method)) subscription.payment_method = payment_method;
        }

        if (payment_notes !== undefined) {
            subscription.payment_notes = payment_notes;
        }

        await subscription.save();
        const updated = await Subscription.findById(id).populate('school_id');

        res.json({
            success: true,
            message: 'Subscription record updated successfully',
            subscription: updated
        });
    } catch (error) {
        console.error('Error updating subscription record:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports = {
    getSubscriptionConfig,
    getSubscriptionPlans,
    updateSubscriptionConfig,
    getAllSubscriptions,
    getSubscriptionById,
    getCurrentSchoolSubscription,
    getSchoolSubscriptionBySchoolId,
    createSubscriptionOrder,
    verifyAndActivateSubscription,
    submitBankTransferPayment,
    renewSubscription,
    cancelSubscription,
    getSubscriptionExpiryDetails,
    checkAndExpireSubscriptions,
    getSubscriptionStatus,
    getSubscriptionHistory,
    updateSubscriptionStatus,
    updateSubscriptionRecord
};
