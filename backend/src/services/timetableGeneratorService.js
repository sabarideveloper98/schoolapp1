const Timetable = require('../models/Timetable');
const TeacherAssignment = require('../models/TeacherAssignment');
const TeacherAvailability = require('../models/TeacherAvailability');
const TimetableSettings = require('../models/TimetableSettings');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const { detectConflicts } = require('./conflictDetectionService');

/**
 * AI-like Automatic Timetable Generator using Constraint-Satisfaction Logic.
 * Generates schedule slots for target classes or all classes in the school.
 */
const generateTimetables = async (school_id, academic_year = '2026-2027', targetClassIds = null) => {
    // 1. Fetch settings
    let settings = await TimetableSettings.findOne({ school_id, academic_year });
    if (!settings) {
        // Create default settings if none exist
        settings = await TimetableSettings.create({
            school_id,
            academic_year,
            school_start_time: '08:45 AM',
            school_end_time: '02:25 PM',
            period_duration: 40,
            lunch_duration: 20,
            lunch_after_period: 4,
            periods_per_day: 8,
            working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            saturday_half_day: true,
            saturday_periods: 4,
            max_teacher_weekly_periods: 36,
            generated_periods: [
                { period_name: 'P1', start_time: '08:45 AM', end_time: '09:25 AM', is_lunch: false },
                { period_name: 'P2', start_time: '09:25 AM', end_time: '10:05 AM', is_lunch: false },
                { period_name: 'P3', start_time: '10:05 AM', end_time: '10:45 AM', is_lunch: false },
                { period_name: 'P4', start_time: '10:45 AM', end_time: '11:25 AM', is_lunch: false },
                { period_name: 'Lunch', start_time: '11:25 AM', end_time: '11:45 AM', is_lunch: true },
                { period_name: 'P5', start_time: '11:45 AM', end_time: '12:25 PM', is_lunch: false },
                { period_name: 'P6', start_time: '12:25 PM', end_time: '01:05 PM', is_lunch: false },
                { period_name: 'P7', start_time: '01:05 PM', end_time: '01:45 PM', is_lunch: false },
                { period_name: 'P8', start_time: '01:45 PM', end_time: '02:25 PM', is_lunch: false }
            ]
        });
    }

    // 2. Fetch classes
    let classQuery = { school_id };
    if (targetClassIds && Array.isArray(targetClassIds) && targetClassIds.length > 0) {
        classQuery._id = { $in: targetClassIds };
    }
    const classes = await Class.find(classQuery);

    if (classes.length === 0) {
        throw new Error('No classes found to generate timetables for.');
    }

    // 3. Fetch teacher assignments
    const assignments = await TeacherAssignment.find({ school_id, academic_year })
        .populate('subject_id')
        .populate('teacher_id')
        .populate('class_id');

    // 4. Fetch teacher unavailabilities
    const availabilities = await TeacherAvailability.find({ school_id });
    const unavailMap = {};
    availabilities.forEach(a => {
        unavailMap[a.teacher_id.toString()] = a.unavailabilities || [];
    });

    const workingDays = settings.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const generatedPeriods = settings.generated_periods && settings.generated_periods.length > 0
        ? settings.generated_periods
        : [
            { period_name: 'P1', is_lunch: false },
            { period_name: 'P2', is_lunch: false },
            { period_name: 'P3', is_lunch: false },
            { period_name: 'P4', is_lunch: false },
            { period_name: 'Lunch', is_lunch: true },
            { period_name: 'P5', is_lunch: false },
            { period_name: 'P6', is_lunch: false },
            { period_name: 'P7', is_lunch: false },
            { period_name: 'P8', is_lunch: false }
        ];

    // Global tracking maps during generation
    // occupiedTeacherMap[day][period_name][teacher_id] = true
    const occupiedTeacherMap = {};
    const teacherPeriodCountMap = {};

    // Helper to check if teacher is unavailable
    const isTeacherUnavailable = (teacherId, day, period_name) => {
        const list = unavailMap[teacherId] || [];
        return list.some(u => u.day === day && u.period_name === period_name);
    };

    const results = [];

    for (const cls of classes) {
        const classAssignments = assignments.filter(a => a.class_id?._id?.toString() === cls._id.toString());
        
        // Build pool of periods to assign for this class
        // Pool: Array of { subject_id, teacher_id, is_lab, lab_type }
        let subjectPool = [];
        classAssignments.forEach(asgn => {
            const count = asgn.weekly_periods_required || 6;
            for (let i = 0; i < count; i++) {
                subjectPool.push({
                    subject_id: asgn.subject_id?._id || asgn.subject_id,
                    teacher_id: asgn.teacher_id?._id || asgn.teacher_id,
                    is_lab: asgn.is_lab_required || false,
                    lab_type: asgn.lab_type || 'None'
                });
            }
        });

        // Shuffle subject pool for even distribution
        subjectPool.sort(() => Math.random() - 0.5);

        const newSchedule = [];

        // Generate grid per day and period
        workingDays.forEach(day => {
            const isSaturday = (day === 'Saturday');
            const satLimit = settings.saturday_half_day ? (settings.saturday_periods || 4) : 99;

            let periodCounter = 0;
            generatedPeriods.forEach(p => {
                if (p.is_lunch || p.period_name === 'Lunch') {
                    newSchedule.push({
                        day,
                        period_name: 'Lunch',
                        subject_id: null,
                        teacher_id: null,
                        is_lab: false,
                        lab_type: 'None',
                        room: 'Cafeteria',
                        is_fixed: true
                    });
                    return;
                }

                periodCounter++;

                // Skip if Saturday exceeds saturday_periods limit
                if (isSaturday && periodCounter > satLimit) {
                    newSchedule.push({
                        day,
                        period_name: p.period_name,
                        subject_id: null,
                        teacher_id: null,
                        is_lab: false,
                        lab_type: 'None',
                        room: 'Main Classroom',
                        is_fixed: false
                    });
                    return;
                }

                // Pick best subject for this slot from pool
                let candidateIndex = -1;
                for (let i = 0; i < subjectPool.length; i++) {
                    const item = subjectPool[i];
                    const tId = item.teacher_id ? item.teacher_id.toString() : null;

                    // Check if teacher is free & available
                    if (tId) {
                        const isTeacherBusy = occupiedTeacherMap[day]?.[p.period_name]?.[tId];
                        const isUnavail = isTeacherUnavailable(tId, day, p.period_name);
                        const currentLoad = teacherPeriodCountMap[tId] || 0;
                        const maxLoad = settings.max_teacher_weekly_periods || 36;

                        if (!isTeacherBusy && !isUnavail && currentLoad < maxLoad) {
                            candidateIndex = i;
                            break;
                        }
                    } else {
                        candidateIndex = i;
                        break;
                    }
                }

                if (candidateIndex !== -1) {
                    const selected = subjectPool.splice(candidateIndex, 1)[0];
                    const tId = selected.teacher_id ? selected.teacher_id.toString() : null;

                    if (tId) {
                        if (!occupiedTeacherMap[day]) occupiedTeacherMap[day] = {};
                        if (!occupiedTeacherMap[day][p.period_name]) occupiedTeacherMap[day][p.period_name] = {};
                        occupiedTeacherMap[day][p.period_name][tId] = true;
                        teacherPeriodCountMap[tId] = (teacherPeriodCountMap[tId] || 0) + 1;
                    }

                    newSchedule.push({
                        day,
                        period_name: p.period_name,
                        subject_id: selected.subject_id,
                        teacher_id: selected.teacher_id,
                        is_lab: selected.is_lab,
                        lab_type: selected.lab_type,
                        room: selected.is_lab ? `${selected.lab_type} Lab` : 'Main Classroom',
                        is_fixed: false
                    });
                } else {
                    // Empty slot if no conflict-free subject left
                    newSchedule.push({
                        day,
                        period_name: p.period_name,
                        subject_id: null,
                        teacher_id: null,
                        is_lab: false,
                        lab_type: 'None',
                        room: 'Main Classroom',
                        is_fixed: false
                    });
                }
            });
        });

        // Save or update timetable document for this class
        const timetableDoc = await Timetable.findOneAndUpdate(
            { school_id, class_id: cls._id, academic_year },
            {
                school_id,
                class_id: cls._id,
                academic_year,
                status: 'Published',
                schedule: newSchedule
            },
            { upsert: true, new: true }
        );

        results.push(timetableDoc);
    }

    // Run conflict detection on the generated timetables to persist logs
    await detectConflicts(school_id, academic_year, true);

    return results;
};

module.exports = { generateTimetables };
