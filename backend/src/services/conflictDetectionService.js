const Timetable = require('../models/Timetable');
const TeacherAssignment = require('../models/TeacherAssignment');
const TeacherAvailability = require('../models/TeacherAvailability');
const TimetableSettings = require('../models/TimetableSettings');
const ConflictLog = require('../models/ConflictLog');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');

/**
 * Perform real-time conflict detection across a school's timetables.
 * Returns an array of detected conflict objects and optionally saves them to ConflictLog.
 */
const detectConflicts = async (school_id, academic_year = '2026-2027', persist = false) => {
    const conflicts = [];

    // Fetch settings
    const settings = await TimetableSettings.findOne({ school_id, academic_year }) || {
        max_teacher_weekly_periods: 36
    };

    // Fetch all active timetables for the school
    const timetables = await Timetable.find({ school_id, academic_year })
        .populate('class_id')
        .populate('schedule.subject_id')
        .populate('schedule.teacher_id');

    // Fetch teacher availabilities
    const availabilities = await TeacherAvailability.find({ school_id });
    const availabilityMap = {};
    availabilities.forEach(a => {
        availabilityMap[a.teacher_id.toString()] = a.unavailabilities || [];
    });

    // Fetch teacher assignments
    const assignments = await TeacherAssignment.find({ school_id, academic_year })
        .populate('teacher_id')
        .populate('subject_id')
        .populate('class_id');

    // 1. Teacher & Room Clashes across (day, period_name)
    // Structure: occupiedTeachers[day][period_name][teacher_id] = [ { class_id, className, period_name } ]
    const occupiedTeachers = {};
    const occupiedRooms = {};
    const teacherPeriodCounts = {};

    timetables.forEach(tt => {
        const classObj = tt.class_id;
        const className = classObj ? `${classObj.class}-${classObj.section}` : 'Class';

        (tt.schedule || []).forEach(slot => {
            if (slot.period_name === 'Lunch' || !slot.day) return;

            const day = slot.day;
            const period = slot.period_name;
            const teacherId = slot.teacher_id ? (slot.teacher_id._id || slot.teacher_id).toString() : null;
            const teacherName = slot.teacher_id ? slot.teacher_id.name : 'Unknown Teacher';
            const room = slot.room || 'Main Classroom';

            if (teacherId) {
                // Count teacher workload
                teacherPeriodCounts[teacherId] = (teacherPeriodCounts[teacherId] || 0) + 1;

                // Check Teacher Collision
                if (!occupiedTeachers[day]) occupiedTeachers[day] = {};
                if (!occupiedTeachers[day][period]) occupiedTeachers[day][period] = {};

                if (!occupiedTeachers[day][period][teacherId]) {
                    occupiedTeachers[day][period][teacherId] = [];
                }

                occupiedTeachers[day][period][teacherId].push({
                    class_id: classObj?._id,
                    className,
                    teacherName,
                    subjectName: slot.subject_id?.name || 'Subject'
                });

                // Check Teacher Unavailability
                const unavailList = availabilityMap[teacherId] || [];
                const isUnavailable = unavailList.some(u => u.day === day && u.period_name === period);
                if (isUnavailable) {
                    conflicts.push({
                        school_id,
                        academic_year,
                        conflict_type: 'Teacher Unavailability Conflict',
                        severity: 'Error',
                        class_id: classObj?._id,
                        teacher_id: slot.teacher_id?._id || teacherId,
                        day,
                        period_name: period,
                        description: `Teacher ${teacherName} is marked unavailable on ${day} ${period} but assigned to ${className}.`
                    });
                }
            }

            // Room clash check (skip generic Main Classroom unless custom room specified)
            if (room && room !== 'Main Classroom') {
                if (!occupiedRooms[day]) occupiedRooms[day] = {};
                if (!occupiedRooms[day][period]) occupiedRooms[day][period] = {};
                if (!occupiedRooms[day][period][room]) occupiedRooms[day][period][room] = [];

                occupiedRooms[day][period][room].push({
                    class_id: classObj?._id,
                    className
                });
            }
        });
    });

    // Flag Teacher Clashes (Teacher assigned to >1 class at same day & period)
    Object.keys(occupiedTeachers).forEach(day => {
        Object.keys(occupiedTeachers[day]).forEach(period => {
            Object.keys(occupiedTeachers[day][period]).forEach(teacherId => {
                const list = occupiedTeachers[day][period][teacherId];
                if (list.length > 1) {
                    const classNames = list.map(l => l.className).join(' and ');
                    const teacherName = list[0].teacherName;
                    conflicts.push({
                        school_id,
                        academic_year,
                        conflict_type: 'Teacher Conflict',
                        severity: 'Error',
                        teacher_id: teacherId,
                        day,
                        period_name: period,
                        description: `Teacher Conflict: ${teacherName} is assigned to multiple classes (${classNames}) on ${day} ${period}.`
                    });
                }
            });
        });
    });

    // Flag Room Clashes
    Object.keys(occupiedRooms).forEach(day => {
        Object.keys(occupiedRooms[day]).forEach(period => {
            Object.keys(occupiedRooms[day][period]).forEach(room => {
                const list = occupiedRooms[day][period][room];
                if (list.length > 1) {
                    const classNames = list.map(l => l.className).join(' and ');
                    conflicts.push({
                        school_id,
                        academic_year,
                        conflict_type: 'Room Conflict',
                        severity: 'Error',
                        day,
                        period_name: period,
                        description: `Room Conflict: ${room} is double-booked by ${classNames} on ${day} ${period}.`
                    });
                }
            });
        });
    });

    // 2. Teacher Workload Overload Check
    const allTeachers = await Teacher.find({ school_id });
    allTeachers.forEach(t => {
        const count = teacherPeriodCounts[t._id.toString()] || 0;
        const maxAllowed = settings.max_teacher_weekly_periods || 36;
        if (count > maxAllowed) {
            conflicts.push({
                school_id,
                academic_year,
                conflict_type: 'Teacher Workload Conflict',
                severity: 'Warning',
                teacher_id: t._id,
                description: `Teacher Overloaded: ${t.name} is assigned ${count} periods/week (Max: ${maxAllowed}).`
            });
        }
    });

    // 3. Subject Frequency Check (Required vs Assigned)
    assignments.forEach(asgn => {
        const classId = asgn.class_id?._id?.toString();
        const subjectId = asgn.subject_id?._id?.toString();
        const reqCount = asgn.weekly_periods_required || 6;

        if (!classId || !subjectId) return;

        const tt = timetables.find(t => t.class_id?._id?.toString() === classId);
        let actualCount = 0;

        if (tt) {
            (tt.schedule || []).forEach(slot => {
                const sId = slot.subject_id ? (slot.subject_id._id || slot.subject_id).toString() : null;
                if (sId === subjectId) {
                    actualCount++;
                }
            });
        }

        if (actualCount < reqCount) {
            const className = asgn.class_id ? `${asgn.class_id.class}-${asgn.class_id.section}` : 'Class';
            const subjectName = asgn.subject_id ? asgn.subject_id.name : 'Subject';
            conflicts.push({
                school_id,
                academic_year,
                conflict_type: 'Subject Frequency Conflict',
                severity: 'Warning',
                class_id: asgn.class_id?._id,
                description: `Subject Frequency Gap in ${className}: ${subjectName} requires ${reqCount} weekly periods, but only ${actualCount} assigned.`
            });
        }
    });

    // Persist to DB if requested
    if (persist) {
        await ConflictLog.deleteMany({ school_id, academic_year });
        if (conflicts.length > 0) {
            await ConflictLog.insertMany(conflicts);
        }
    }

    return conflicts;
};

module.exports = { detectConflicts };
