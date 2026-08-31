const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getTeachers, createTeacher, deleteTeacher, updateTeacher,
    getStaff, createStaff, deleteStaff, updateStaff,
    getSubjects, createSubject, deleteSubject, updateSubject,
    getClasses, createClass, deleteClass, updateClass,
    getClassSubjects, assignSubjectTeacher, removeSubjectTeacher, updateSubjectTeacher,
    getStudents, createStudent, updateStudent, deleteStudent
} = require('../controllers/schoolAdminController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { 
    getStaffAttendance, saveStaffAttendance, getStaffAttendanceReport,
    getStudentAttendance, saveStudentAttendance, getStudentAttendanceReport
} = require('../controllers/attendanceController');
const {
    getExams, createExam, getExamStudentsMarks, saveExamMarks, getExamReport
} = require('../controllers/examController');
const {
    getSalarySetupList, saveSalarySetup, getSalarySetupHistory,
    fetchPayrollDraft, savePayroll, getPayrollList,
    updatePayrollStatus, getPayrollReports, getPayrollDashboardStats
} = require('../controllers/payrollController');
const {
    getFeeCategories, createFeeCategory, updateFeeCategory, deleteFeeCategory,
    getFeeStructures, createFeeStructure, updateFeeStructure, deleteFeeStructure,
    getStudentFeesList, assignStudentFee, bulkAssignStudentFee,
    getFeeDiscounts, createFeeDiscount, updateFeeDiscount, deleteFeeDiscount,
    searchStudentForFee, collectStudentFee,
    getRefundsList, updateRefundStatus,
    getFeeReports, getFeeDashboardStats
} = require('../controllers/feeController');
const {
    getExpenseCategories, createExpenseCategory, updateExpenseCategory, deleteExpenseCategory,
    getExpenses, createExpense, updateExpense, deleteExpense,
    getIncomeList, createIncome, updateIncome, deleteIncome,
    getFinanceDashboardStats, getFinancialReports
} = require('../controllers/financeController');

// All routes require SchoolAdmin role
router.use(protect);
router.use(authorize('SchoolAdmin'));

router.get('/dashboard', getDashboardStats);

router.route('/teachers').get(getTeachers).post(createTeacher);
router.route('/teachers/:id').put(updateTeacher).delete(deleteTeacher);

router.route('/staff').get(getStaff).post(createStaff);
router.route('/staff/:id').put(updateStaff).delete(deleteStaff);

router.route('/subjects').get(getSubjects).post(createSubject);
router.route('/subjects/:id').put(updateSubject).delete(deleteSubject);

router.route('/classes').get(getClasses).post(createClass);
router.route('/classes/:id').put(updateClass).delete(deleteClass);

router.route('/assignments').get(getClassSubjects).post(assignSubjectTeacher);
router.route('/assignments/:id').put(updateSubjectTeacher).delete(removeSubjectTeacher);

router.route('/students').get(getStudents).post(createStudent);
router.route('/students/:id').put(updateStudent).delete(deleteStudent);

router.route('/attendance').get(getStaffAttendance).post(saveStaffAttendance);
router.route('/attendance/report').get(getStaffAttendanceReport);
router.route('/student-attendance').get(getStudentAttendance).post(saveStudentAttendance);
router.route('/student-attendance/report').get(getStudentAttendanceReport);

router.route('/exams').get(getExams).post(createExam);
router.route('/exam-marks').get(getExamStudentsMarks).post(saveExamMarks);
router.route('/exam-report').get(getExamReport);

// Payroll & Salary Management
router.route('/payroll/setup').get(getSalarySetupList).post(saveSalarySetup);
router.route('/payroll/setup/history/:id').get(getSalarySetupHistory);
router.route('/payroll/draft').get(fetchPayrollDraft);
router.route('/payroll').get(getPayrollList).post(savePayroll);
router.route('/payroll/reports').get(getPayrollReports);
router.route('/payroll/dashboard').get(getPayrollDashboardStats);
router.route('/payroll/:id').put(updatePayrollStatus);

// Fee Management Module
router.route('/fees/categories').get(getFeeCategories).post(createFeeCategory);
router.route('/fees/categories/:id').put(updateFeeCategory).delete(deleteFeeCategory);
router.route('/fees/structures').get(getFeeStructures).post(createFeeStructure);
router.route('/fees/structures/:id').put(updateFeeStructure).delete(deleteFeeStructure);
router.route('/fees/assignments').get(getStudentFeesList).post(assignStudentFee);
router.route('/fees/assignments/bulk').post(bulkAssignStudentFee);
router.route('/fees/discounts').get(getFeeDiscounts).post(createFeeDiscount);
router.route('/fees/discounts/:id').put(updateFeeDiscount).delete(deleteFeeDiscount);
router.route('/fees/search').get(searchStudentForFee);
router.route('/fees/collect').post(collectStudentFee);
router.route('/fees/refunds').get(getRefundsList).put(updateRefundStatus);
router.route('/fees/reports').get(getFeeReports);
router.route('/fees/dashboard').get(getFeeDashboardStats);

// School Expenses & Finance Module
router.route('/finance/categories').get(getExpenseCategories).post(createExpenseCategory);
router.route('/finance/categories/:id').put(updateExpenseCategory).delete(deleteExpenseCategory);
router.route('/finance/expenses').get(getExpenses).post(createExpense);
router.route('/finance/expenses/:id').put(updateExpense).delete(deleteExpense);
router.route('/finance/income').get(getIncomeList).post(createIncome);
router.route('/finance/income/:id').put(updateIncome).delete(deleteIncome);
router.route('/finance/dashboard').get(getFinanceDashboardStats);
router.route('/finance/reports').get(getFinancialReports);

module.exports = router;
