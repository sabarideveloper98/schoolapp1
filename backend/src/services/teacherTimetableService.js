const mongoose = require('mongoose');
const TimetableMaster = require('../models/TimetableMaster');
const TimetableEntry = require('../models/TimetableEntry');
const Timetable = require('../models/Timetable');
const PeriodConfig = require('../models/PeriodConfig');
const TimetableSettings = require('../models/TimetableSettings');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const TeacherAssignment = require('../models/TeacherAssignment');
const ClassSubject = require('../models/ClassSubject');

/**
 * Convert time string (e.g., "09:00 AM", "1:30 PM", "14:15") to minutes from midnight
 */
const parseTimeToMinutes = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return null;
    const clean = timeStr.trim();
    const match = clean.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return null;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const modifier = (match[3] || '').toUpperCase();
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
};

/**
 * Format minutes from midnight to standard 12-hour AM/PM string
 */
const formatMinutesToTime = (totalMinutes) => {
    if (totalMinutes === null || totalMinutes === undefined) return '';
    let hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

/**
 * Compute the specific ISO Date (YYYY-MM-DD) for a weekday in the current week
 */
const getWeekDateForDay = (dayName, referenceDate = new Date()) => {
    const daysMap = {
        'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
        'thursday': 4, 'friday': 5, 'saturday': 6
    };
    const targetIdx = daysMap[(dayName || '').toLowerCase()];
    if (targetIdx === undefined) return null;

    const currentIdx = referenceDate.getDay();
    const diff = targetIdx - currentIdx;
    const targetDate = new Date(referenceDate);
    targetDate.setDate(referenceDate.getDate() + diff);
    return targetDate.toISOString().split('T')[0];
};

/**
 * Format Class Name cleanly (e.g. "Grade 10" or "Class 1")
 */
const formatClassName = (rawClass) => {
    if (!rawClass) return 'Class 10';
    const str = String(rawClass).trim();
    if (str.toLowerCase().startsWith('class') || str.toLowerCase().startsWith('grade')) {
        return str;
    }
    return `Class ${str}`;
};

/**
 * Fetch and build the complete normalized, enriched timetable schedule for a teacher
 */
const getEnrichedTeacherSchedule = async (teacher, school_id) => {
    const teacherId = teacher._id;
    const teacherIds = [teacherId];
    if (teacher.user_id) teacherIds.push(teacher.user_id);

    // 1. Fetch settings and period configurations
    const settings = await TimetableSettings.findOne({ school_id }) || {};
    const periodsConfig = await PeriodConfig.find({ school_id }).sort({ order: 1 });

    const periodTimingMap = {};
    const periodsList = (periodsConfig && periodsConfig.length > 0)
        ? periodsConfig
        : (settings?.generated_periods && settings.generated_periods.length > 0)
            ? settings.generated_periods
            : [
                { period_name: 'P1', start_time: '08:45 AM', end_time: '09:25 AM', order: 1, type: 'Teaching Period' },
                { period_name: 'P2', start_time: '09:25 AM', end_time: '10:05 AM', order: 2, type: 'Teaching Period' },
                { period_name: 'P3', start_time: '10:05 AM', end_time: '10:45 AM', order: 3, type: 'Teaching Period' },
                { period_name: 'P4', start_time: '10:45 AM', end_time: '11:25 AM', order: 4, type: 'Teaching Period' },
                { period_name: 'Lunch', start_time: '11:25 AM', end_time: '11:45 AM', order: 5, type: 'Lunch', is_lunch: true },
                { period_name: 'P5', start_time: '11:45 AM', end_time: '12:25 PM', order: 6, type: 'Teaching Period' },
                { period_name: 'P6', start_time: '12:25 PM', end_time: '01:05 PM', order: 7, type: 'Teaching Period' },
                { period_name: 'P7', start_time: '01:05 PM', end_time: '01:45 PM', order: 8, type: 'Teaching Period' },
                { period_name: 'P8', start_time: '01:45 PM', end_time: '02:25 PM', order: 9, type: 'Teaching Period' }
            ];

    periodsList.forEach(p => {
        if (!p.period_name) return;
        const key = p.period_name.toUpperCase().trim();
        periodTimingMap[key] = {
            start_time: p.start_time,
            end_time: p.end_time,
            type: p.type || 'Teaching Period',
            order: p.order || 1
        };
    });

    const scheduleMap = new Map();

    // 2. Fetch from TimetableEntry collection
    const entries = await TimetableEntry.find({ teacher_id: { $in: teacherIds } })
        .populate({
            path: 'timetable_id',
            populate: { path: 'class_id' }
        })
        .populate('subject_id');

    entries.forEach(e => {
        if (!e.day || !e.period_name) return;
        const cls = e.timetable_id?.class_id;
        const rawClass = cls?.class || '1';
        const section = cls?.section || e.timetable_id?.section_id || 'A';
        const clsName = formatClassName(rawClass);
        const sectionName = section;
        const pKey = e.period_name.toUpperCase().trim();
        const timing = periodTimingMap[pKey] || { start_time: '09:00 AM', end_time: '09:45 AM', order: 1 };

        const numMatch = e.period_name.match(/\d+/);
        const periodNum = numMatch ? parseInt(numMatch[0], 10) : (timing.order || 1);

        const slotKey = `${e.day.toLowerCase()}-${pKey}`;
        scheduleMap.set(slotKey, {
            _id: e._id,
            teacherId: teacher.teacher_id || teacher._id.toString(),
            teacherName: teacher.name,
            classId: cls?._id?.toString() || '',
            className: clsName,
            class_name: `${clsName} - ${sectionName}`,
            sectionName: sectionName,
            section_name: sectionName,
            subjectId: e.subject_id?._id?.toString() || '',
            subject_id: e.subject_id?._id?.toString() || '',
            subjectName: e.subject_id?.name || 'General',
            subject_name: e.subject_id?.name || 'General',
            periodNumber: periodNum,
            period_name: e.period_name,
            periodName: e.period_name,
            startTime: timing.start_time,
            start_time: timing.start_time,
            endTime: timing.end_time,
            end_time: timing.end_time,
            durationMinutes: (parseTimeToMinutes(timing.end_time) - parseTimeToMinutes(timing.start_time)) || 40,
            timetableDay: e.day,
            day: e.day,
            timetableDate: getWeekDateForDay(e.day),
            roomNumber: e.room_no || '101',
            room_no: e.room_no || '101',
            academicYear: e.timetable_id?.academic_year_id || '2026-2027',
            status: e.timetable_id?.status || 'Active'
        });
    });

    // 3. Fetch from Timetable collection
    const timetables = await Timetable.find({ school_id }).populate('class_id schedule.subject_id');
    timetables.forEach(tt => {
        const cls = tt.class_id;
        const rawClass = cls?.class || '1';
        const section = cls?.section || 'A';
        const clsName = formatClassName(rawClass);
        const sectionName = section;

        (tt.schedule || []).forEach(slot => {
            const sTid = slot.teacher_id?.toString();
            if (sTid && teacherIds.some(id => id.toString() === sTid) && slot.day && slot.period_name) {
                const pKey = slot.period_name.toUpperCase().trim();
                const slotKey = `${slot.day.toLowerCase()}-${pKey}`;

                if (!scheduleMap.has(slotKey)) {
                    const timing = periodTimingMap[pKey] || { start_time: '09:00 AM', end_time: '09:45 AM', order: 1 };
                    const numMatch = slot.period_name.match(/\d+/);
                    const periodNum = numMatch ? parseInt(numMatch[0], 10) : (timing.order || 1);

                    scheduleMap.set(slotKey, {
                        _id: slot._id || new mongoose.Types.ObjectId(),
                        teacherId: teacher.teacher_id || teacher._id.toString(),
                        teacherName: teacher.name,
                        classId: cls?._id?.toString() || '',
                        className: clsName,
                        class_name: `${clsName} - ${sectionName}`,
                        sectionName: sectionName,
                        section_name: sectionName,
                        subjectId: slot.subject_id?._id?.toString() || '',
                        subject_id: slot.subject_id?._id?.toString() || '',
                        subjectName: slot.subject_id?.name || (slot.is_lab ? 'Lab' : 'General'),
                        subject_name: slot.subject_id?.name || (slot.is_lab ? 'Lab' : 'General'),
                        periodNumber: periodNum,
                        period_name: slot.period_name,
                        periodName: slot.period_name,
                        startTime: timing.start_time,
                        start_time: timing.start_time,
                        endTime: timing.end_time,
                        end_time: timing.end_time,
                        durationMinutes: (parseTimeToMinutes(timing.end_time) - parseTimeToMinutes(timing.start_time)) || 40,
                        timetableDay: slot.day,
                        day: slot.day,
                        timetableDate: getWeekDateForDay(slot.day),
                        roomNumber: slot.room || '101',
                        room_no: slot.room || '101',
                        academicYear: tt.academic_year || '2026-2027',
                        status: tt.status || 'Active'
                    });
                }
            }
        });
    });

    const schedule = Array.from(scheduleMap.values());

    // Sort schedule by weekday, then start time
    const dayOrder = { 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6, 'sunday': 7 };
    schedule.sort((a, b) => {
        const dDiff = (dayOrder[a.day.toLowerCase()] || 0) - (dayOrder[b.day.toLowerCase()] || 0);
        if (dDiff !== 0) return dDiff;
        return (parseTimeToMinutes(a.startTime) || 0) - (parseTimeToMinutes(b.startTime) || 0);
    });

    const totalPeriods = schedule.length;
    const maxAllowed = settings.max_teacher_weekly_periods || 36;
    const workloadStatus = totalPeriods > maxAllowed ? 'OVERLOADED' : 'OK';

    return {
        teacher,
        settings,
        periods: periodsList,
        schedule,
        entries: schedule,
        totalPeriods,
        maxAllowed,
        workloadStatus
    };
};

module.exports = {
    parseTimeToMinutes,
    formatMinutesToTime,
    getWeekDateForDay,
    formatClassName,
    getEnrichedTeacherSchedule
};
