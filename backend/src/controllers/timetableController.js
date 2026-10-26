const mongoose = require('mongoose');
const Timetable = require('../models/Timetable');
const TimetableMaster = require('../models/TimetableMaster');
const TimetableEntry = require('../models/TimetableEntry');
const PeriodConfig = require('../models/PeriodConfig');
const TimetableSettings = require('../models/TimetableSettings');
const TeacherAssignment = require('../models/TeacherAssignment');
const ClassSubject = require('../models/ClassSubject');
const TeacherAvailability = require('../models/TeacherAvailability');
const ConflictLog = require('../models/ConflictLog');
const TimetableHistory = require('../models/TimetableHistory');
const AuditLog = require('../models/AuditLog');
const School = require('../models/School');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');
const Student = require('../models/Student');
const { detectConflicts } = require('../services/conflictDetectionService');
const { generateTimetables } = require('../services/timetableGeneratorService');

const getSchoolId = async (user) => {
    if (!user) return null;
    const schoolByAdmin = await School.findOne({ admin_id: user._id });
    if (schoolByAdmin) return schoolByAdmin._id;
    if (user.school_id) {
        const schoolById = await School.findById(user.school_id);
        if (schoolById) return schoolById._id;
        return user.school_id;
    }
    if (user.reference_id) {
        const teacher = await Teacher.findById(user.reference_id);
        if (teacher && teacher.school_id) return teacher.school_id;
    }
    const teacherByUser = await Teacher.findOne({ user_id: user._id });
    if (teacherByUser && teacherByUser.school_id) return teacherByUser.school_id;
    return user._id;
};

// GET /api/timetable - Master dashboard & list
const getAllTimetables = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const academic_year = req.query.academic_year || '2026-2027';

        const masters = await TimetableMaster.find({ school_id, academic_year_id: academic_year })
            .populate('class_id')
            .populate('created_by', 'email');

        const totalClasses = await Class.countDocuments({ school_id });
        const totalTeachers = await Teacher.countDocuments({ school_id });
        const scheduledCount = masters.length;

        const periods = await PeriodConfig.find({ school_id });
        const totalPossibleSlots = scheduledCount * (periods.length || 8) * 6;
        const assignedEntries = await TimetableEntry.countDocuments({
            timetable_id: { $in: masters.map(m => m._id) },
            subject_id: { $ne: null }
        });
        const unassignedPeriods = Math.max(0, totalPossibleSlots - assignedEntries);

        res.json({
            totalTimetables: scheduledCount,
            classesScheduled: scheduledCount,
            totalClasses,
            teachersAssigned: totalTeachers,
            unassignedPeriods,
            timetables: masters
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch timetables', error: error.message });
    }
};

// GET /api/timetable/class/:classId/:sectionId
const getClassTimetableBySection = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const { classId, sectionId } = req.params;
        const academic_year = req.query.academic_year || '2026-2027';

        let classObj = await Class.findById(classId).populate('class_incharge_id');
        if (!classObj) {
            classObj = await Class.findOne({ school_id, class: classId, section: sectionId }).populate('class_incharge_id');
        }

        if (!classObj) {
            return res.status(404).json({ message: 'Class not found' });
        }

        let master = await TimetableMaster.findOne({ school_id, class_id: classObj._id, academic_year_id: academic_year });
        let entries = [];

        if (master) {
            entries = await TimetableEntry.find({ timetable_id: master._id })
                .populate('subject_id')
                .populate('teacher_id');
        }

        const periods = await PeriodConfig.find({ school_id }).sort({ order: 1 });
        const taAssignments = await TeacherAssignment.find({ school_id, class_id: classObj._id })
            .populate('teacher_id')
            .populate('subject_id');
        const csAssignments = await ClassSubject.find({ school_id, class_id: classObj._id })
            .populate('teacher_id')
            .populate('subject_id');
        const assignments = [...taAssignments, ...csAssignments];

        res.json({
            classObj,
            master: master || { class_id: classObj._id, status: 'Not Created' },
            entries,
            periods,
            assignments
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch class timetable', error: error.message });
    }
};

// GET /api/timetable/teacher/:teacherId or /api/timetable/teacher
const getTeacherTimetableByTeacherId = async (req, res) => {
    try {
        const { teacherId } = req.params;

        let teacher = null;
        if (!teacherId || teacherId === 'me' || teacherId === 'my') {
            if (req.user) {
                teacher = await Teacher.findById(req.user._id)
                    || await Teacher.findOne({ user_id: req.user._id })
                    || (req.user.reference_id ? await Teacher.findById(req.user.reference_id) : null);
            }
        } else if (mongoose.Types.ObjectId.isValid(teacherId)) {
            teacher = await Teacher.findById(teacherId);
            if (!teacher) {
                teacher = await Teacher.findOne({ user_id: teacherId });
            }
        }

        if (!teacher && req.user) {
            teacher = await Teacher.findById(req.user._id)
                || await Teacher.findOne({ user_id: req.user._id })
                || (req.user.reference_id ? await Teacher.findById(req.user.reference_id) : null);
        }

        if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

        const school_id = teacher.school_id || (await getSchoolId(req.user));
        const settings = await TimetableSettings.findOne({ school_id }) || {};
        const periods = await PeriodConfig.find({ school_id }).sort({ order: 1 });

        const scheduleMap = new Map();
        const teacherIds = [teacher._id];
        if (teacher.user_id) teacherIds.push(teacher.user_id);

        // 1. Fetch from TimetableEntry collection
        const entries = await TimetableEntry.find({ teacher_id: { $in: teacherIds } })
            .populate({
                path: 'timetable_id',
                populate: { path: 'class_id' }
            })
            .populate('subject_id');

        entries.forEach(e => {
            if (!e.day || !e.period_name) return;
            const cls = e.timetable_id?.class_id;
            const clsName = cls ? (cls.section ? `${cls.class}-${cls.section}` : cls.class) : 'Class';
            const key = `${e.day}-${e.period_name.toUpperCase()}`;
            scheduleMap.set(key, {
                _id: e._id,
                day: e.day,
                period_name: e.period_name,
                subject_name: e.subject_id?.name || 'General',
                subjectName: e.subject_id?.name || 'General',
                className: clsName,
                class_name: clsName,
                room_no: e.room_no || ''
            });
        });

        // 2. Fetch from Timetable collection
        const timetables = await Timetable.find({ school_id }).populate('class_id schedule.subject_id');
        timetables.forEach(tt => {
            const cls = tt.class_id;
            const clsName = cls ? (cls.section ? `${cls.class}-${cls.section}` : cls.class) : 'Class';
            (tt.schedule || []).forEach(slot => {
                const sTid = slot.teacher_id?.toString();
                if (sTid && teacherIds.some(id => id.toString() === sTid) && slot.day && slot.period_name) {
                    const key = `${slot.day}-${slot.period_name.toUpperCase()}`;
                    if (!scheduleMap.has(key)) {
                        scheduleMap.set(key, {
                            _id: slot._id,
                            day: slot.day,
                            period_name: slot.period_name,
                            subject_name: slot.subject_id?.name || (slot.is_lab ? 'Lab' : 'General'),
                            subjectName: slot.subject_id?.name || (slot.is_lab ? 'Lab' : 'General'),
                            className: clsName,
                            class_name: clsName,
                            room_no: slot.room || ''
                        });
                    }
                }
            });
        });

        const schedule = Array.from(scheduleMap.values());
        const totalPeriods = schedule.length;
        const maxAllowed = settings.max_teacher_weekly_periods || 36;
        const workloadStatus = totalPeriods > maxAllowed ? 'OVERLOADED' : 'OK';

        res.json({
            teacher,
            settings,
            periods,
            totalPeriods,
            maxAllowed,
            workloadStatus,
            schedule,
            entries: schedule
        });
    } catch (error) {
        console.error('getTeacherTimetableByTeacherId error:', error);
        res.status(500).json({ message: 'Failed to fetch teacher timetable', error: error.message });
    }
};

// POST /api/timetable/create - Create Timetable & Entries with Validation Rules
const createTimetable = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const {
            academic_year_id = '2026-2027',
            class_id,
            section_id,
            entries = [],
            status = 'Draft'
        } = req.body;

        if (!class_id) {
            return res.status(400).json({ message: 'class_id is required' });
        }

        // VALIDATION 1: Teacher Clash Check
        for (const entry of entries) {
            if (!entry.teacher_id || !entry.day || !entry.period_name) continue;

            const existingClash = await TimetableEntry.find({
                day: entry.day,
                period_name: entry.period_name,
                teacher_id: entry.teacher_id
            }).populate({
                path: 'timetable_id',
                match: { school_id, academic_year_id, class_id: { $ne: class_id } }
            });

            const trueClashes = existingClash.filter(e => e.timetable_id != null);

            if (trueClashes.length > 0) {
                const teacherObj = await Teacher.findById(entry.teacher_id);
                return res.status(400).json({
                    message: `Teacher already assigned for this period. Teacher ${teacherObj?.name || ''} is busy on ${entry.day} ${entry.period_name}.`
                });
            }
        }

        // VALIDATION 2: Subject Daily Limit (Max 2 periods per day for same subject)
        const daySubjectCounts = {};
        for (const entry of entries) {
            if (!entry.subject_id || !entry.day) continue;
            const key = `${entry.day}-${entry.subject_id}`;
            daySubjectCounts[key] = (daySubjectCounts[key] || 0) + 1;
            if (daySubjectCounts[key] > 2) {
                const subjObj = await Subject.findById(entry.subject_id);
                return res.status(400).json({
                    message: `Subject Daily Limit Exceeded. ${subjObj?.name || 'Subject'} cannot exceed 2 periods on ${entry.day}.`
                });
            }
        }

        // VALIDATION 3: Teacher Eligibility Check (Teacher must be assigned to subject for this class if assignments exist)
        for (const entry of entries) {
            if (!entry.teacher_id || !entry.subject_id) continue;

            const assignmentCount = await TeacherAssignment.countDocuments({
                school_id,
                class_id,
                subject_id: entry.subject_id
            });
            const classSubjectCount = await ClassSubject.countDocuments({
                school_id,
                class_id,
                subject_id: entry.subject_id
            });

            if (assignmentCount > 0 || classSubjectCount > 0) {
                const isAssigned = await TeacherAssignment.exists({
                    school_id,
                    class_id,
                    subject_id: entry.subject_id,
                    teacher_id: entry.teacher_id
                }) || await ClassSubject.exists({
                    school_id,
                    class_id,
                    subject_id: entry.subject_id,
                    teacher_id: entry.teacher_id
                });

                if (!isAssigned) {
                    const cls = await Class.findById(class_id);
                    const isIncharge = cls && cls.class_incharge_id && cls.class_incharge_id.toString() === entry.teacher_id.toString();
                    if (!isIncharge) {
                        const teacherObj = await Teacher.findById(entry.teacher_id);
                        const subjObj = await Subject.findById(entry.subject_id);
                        return res.status(400).json({
                            message: `Teacher ${teacherObj?.name || 'Selected teacher'} is not assigned to teach ${subjObj?.name || 'this subject'} for this class.`
                        });
                    }
                }
            }
        }

        // Upsert master
        let master = await TimetableMaster.findOneAndUpdate(
            { school_id, class_id, academic_year_id },
            {
                school_id,
                academic_year_id,
                class_id,
                section_id: section_id || 'A',
                status,
                created_by: req.user._id
            },
            { upsert: true, new: true }
        );

        // Replace entries
        await TimetableEntry.deleteMany({ timetable_id: master._id });

        const entryDocs = entries.map(e => ({
            timetable_id: master._id,
            day: e.day,
            period_name: e.period_name,
            subject_id: e.subject_id || null,
            teacher_id: e.teacher_id || null,
            room_no: e.room_no || '',
            remarks: e.remarks || ''
        }));

        if (entryDocs.length > 0) {
            await TimetableEntry.insertMany(entryDocs);
        }

        // Mirror to main Timetable collection
        const schedule = entryDocs.map(e => ({
            day: e.day,
            period_name: e.period_name,
            subject_id: e.subject_id,
            teacher_id: e.teacher_id,
            room: e.room_no || 'Main Classroom',
            is_fixed: e.period_name === 'Lunch'
        }));

        await Timetable.findOneAndUpdate(
            { school_id, class_id, academic_year: academic_year_id },
            { school_id, class_id, academic_year: academic_year_id, status, schedule },
            { upsert: true }
        );

        res.json({ message: 'Timetable created successfully', master, entryCount: entryDocs.length });
    } catch (error) {
        console.error('Create timetable error:', error);
        res.status(500).json({ message: 'Failed to create timetable', error: error.message });
    }
};

// PUT /api/timetable/update/:id
const updateTimetable = async (req, res) => {
    try {
        const { id } = req.params;
        const { entries = [], status } = req.body;

        const master = await TimetableMaster.findById(id);
        if (!master) return res.status(404).json({ message: 'Timetable master not found' });

        if (status) master.status = status;
        await master.save();

        if (entries.length > 0) {
            await TimetableEntry.deleteMany({ timetable_id: master._id });
            const entryDocs = entries.map(e => ({
                timetable_id: master._id,
                day: e.day,
                period_name: e.period_name,
                subject_id: e.subject_id || null,
                teacher_id: e.teacher_id || null,
                room_no: e.room_no || '',
                remarks: e.remarks || ''
            }));
            await TimetableEntry.insertMany(entryDocs);
        }

        res.json({ message: 'Timetable updated successfully', master });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update timetable', error: error.message });
    }
};

// DELETE /api/timetable/delete/:id
const deleteTimetable = async (req, res) => {
    try {
        const { id } = req.params;
        const master = await TimetableMaster.findByIdAndDelete(id);
        if (master) {
            await TimetableEntry.deleteMany({ timetable_id: master._id });
            await Timetable.deleteMany({ school_id: master.school_id, class_id: master.class_id });
        }
        res.json({ message: 'Timetable deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete timetable', error: error.message });
    }
};

// GET /api/timetable/print
const getPrintTimetable = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const { type = 'class', id } = req.query;

        if (type === 'class' && id) {
            return getClassTimetableBySection(req, res);
        } else if (type === 'teacher' && id) {
            return getTeacherTimetableByTeacherId(req, res);
        }

        const masters = await TimetableMaster.find({ school_id }).populate('class_id');
        res.json({ masters });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch print data', error: error.message });
    }
};

// Original Stats & Settings Handlers
const getDashboardStats = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const academic_year = req.query.academic_year || '2026-2027';

        const totalClasses = await Class.countDocuments({ school_id });
        const totalTeachers = await Teacher.countDocuments({ school_id });
        const totalSubjects = await Subject.countDocuments({ school_id });

        const assignments = await TeacherAssignment.find({ school_id, academic_year });
        const assignedSubjectsCount = new Set(assignments.map(a => a.subject_id.toString())).size;
        const activeTimetablesCount = await Timetable.countDocuments({ school_id, academic_year, status: 'Published' });
        const conflicts = await detectConflicts(school_id, academic_year, true);

        res.json({
            totalClasses,
            totalTeachers,
            totalSubjects,
            assignedSubjects: assignedSubjectsCount,
            activeTimetables: activeTimetablesCount,
            conflictsCount: conflicts.length,
            conflicts
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch timetable dashboard stats', error: error.message });
    }
};

const getSettings = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const academic_year = req.query.academic_year || '2026-2027';

        let settings = await TimetableSettings.findOne({ school_id, academic_year });
        if (!settings) {
            settings = await TimetableSettings.findOne({ school_id });
        }
        if (!settings) {
            settings = await TimetableSettings.create({ school_id, academic_year });
        }

        // Sync and ensure generated_periods have _id from PeriodConfig
        const periodConfigs = await PeriodConfig.find({ school_id }).sort({ order: 1 });
        if (!settings.generated_periods || settings.generated_periods.length === 0) {
            if (periodConfigs && periodConfigs.length > 0) {
                settings.generated_periods = periodConfigs.map(p => ({
                    _id: p._id,
                    period_name: p.period_name,
                    start_time: p.start_time,
                    end_time: p.end_time,
                    type: (p.is_lunch || p.type === 'Lunch') ? 'Lunch' : (p.is_break || p.type === 'Break') ? 'Break' : (p.type || 'Teaching Period'),
                    is_lunch: !!p.is_lunch || p.type === 'Lunch',
                    is_break: !!p.is_break || p.type === 'Break'
                }));
                await settings.save();
            }
        } else if (periodConfigs && periodConfigs.length > 0) {
            // Attach matching PeriodConfig _id if generated_periods are missing _id
            let needsSave = false;
            settings.generated_periods = settings.generated_periods.map((gp, idx) => {
                const gpObj = gp.toObject ? gp.toObject() : gp;
                if (!gpObj._id) {
                    const matchedCfg = periodConfigs.find(pc => 
                        pc.period_name.trim().toLowerCase() === (gpObj.period_name || '').trim().toLowerCase() ||
                        pc.order === idx + 1
                    );
                    if (matchedCfg) {
                        needsSave = true;
                        return { ...gpObj, _id: matchedCfg._id };
                    }
                }
                return gpObj;
            });
            if (needsSave) {
                await settings.save();
            }
        }

        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch settings', error: error.message });
    }
};

const saveSettings = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const academic_year = req.body.academic_year || '2026-2027';

        const sanitizedPeriods = (req.body.generated_periods && Array.isArray(req.body.generated_periods))
            ? req.body.generated_periods.map(p => {
                const derivedType = (p.is_lunch || p.type === 'Lunch') ? 'Lunch' : (p.is_break || p.type === 'Break') ? 'Break' : (p.type || 'Teaching Period');
                return {
                    ...(p._id ? { _id: p._id } : {}),
                    period_name: p.period_name,
                    start_time: p.start_time,
                    end_time: p.end_time,
                    type: derivedType,
                    is_lunch: derivedType === 'Lunch',
                    is_break: derivedType === 'Break'
                };
            })
            : [];

        // Validate that end_time is later than start_time for all periods
        const parseTimeToMinutes = (timeStr) => {
            if (!timeStr || typeof timeStr !== 'string') return null;
            const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
            if (!match) return null;
            let hrs = parseInt(match[1], 10);
            const mins = parseInt(match[2], 10);
            const ampm = match[3] ? match[3].toUpperCase() : null;
            if (ampm === 'PM' && hrs < 12) hrs += 12;
            if (ampm === 'AM' && hrs === 12) hrs = 0;
            return hrs * 60 + mins;
        };

        for (const p of sanitizedPeriods) {
            const startMins = parseTimeToMinutes(p.start_time);
            const endMins = parseTimeToMinutes(p.end_time);
            if (startMins !== null && endMins !== null && endMins <= startMins) {
                return res.status(400).json({
                    message: `Invalid timing for period "${p.period_name || 'Unnamed'}": End time (${p.end_time}) must be later than start time (${p.start_time}).`
                });
            }
        }

        const updateData = {
            ...req.body,
            school_id,
            academic_year,
            generated_periods: sanitizedPeriods
        };

        let settings = await TimetableSettings.findOneAndUpdate(
            { school_id },
            updateData,
            { upsert: true, new: true }
        );

        if (sanitizedPeriods.length > 0) {
            const existingConfigs = await PeriodConfig.find({ school_id }).sort({ order: 1 });
            const existingById = new Map();
            const existingByName = new Map();
            const existingByOrder = new Map();

            existingConfigs.forEach(ec => {
                existingById.set(ec._id.toString(), ec);
                existingByName.set(ec.period_name.trim().toLowerCase(), ec);
                existingByOrder.set(ec.order, ec);
            });

            const processedIds = new Set();
            for (let idx = 0; idx < sanitizedPeriods.length; idx++) {
                const p = sanitizedPeriods[idx];
                const pNameKey = (p.period_name || '').trim().toLowerCase();
                const targetOrder = idx + 1;

                let matched = null;
                if (p._id && existingById.has(p._id.toString())) {
                    matched = existingById.get(p._id.toString());
                } else if (existingByName.has(pNameKey)) {
                    matched = existingByName.get(pNameKey);
                } else if (existingByOrder.has(targetOrder) && !processedIds.has(existingByOrder.get(targetOrder)._id.toString())) {
                    matched = existingByOrder.get(targetOrder);
                }

                if (matched) {
                    matched.period_name = p.period_name;
                    matched.start_time = p.start_time;
                    matched.end_time = p.end_time;
                    matched.type = p.type;
                    matched.is_lunch = p.is_lunch;
                    matched.is_break = p.is_break;
                    matched.order = targetOrder;
                    await matched.save();
                    processedIds.add(matched._id.toString());
                    // Update the _id in settings if not present
                    if (!p._id) {
                        p._id = matched._id;
                    }
                } else {
                    const newConfig = new PeriodConfig({
                        school_id,
                        period_name: p.period_name,
                        start_time: p.start_time,
                        end_time: p.end_time,
                        type: p.type,
                        is_lunch: p.is_lunch,
                        is_break: p.is_break,
                        order: targetOrder
                    });
                    await newConfig.save();
                    processedIds.add(newConfig._id.toString());
                    p._id = newConfig._id;
                }
            }

            // Remove only orphaned periods that were explicitly removed
            for (const ec of existingConfigs) {
                if (!processedIds.has(ec._id.toString())) {
                    await PeriodConfig.findByIdAndDelete(ec._id);
                }
            }

            // Ensure settings has all _ids
            settings.generated_periods = sanitizedPeriods;
            await settings.save();
        }

        res.json({ message: 'Settings saved', settings });
    } catch (error) {
        res.status(500).json({ message: 'Failed to save settings', error: error.message });
    }
};

const getClasses = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const classes = await Class.find({ school_id }).populate('class_incharge_id');
        res.json(classes);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch classes', error: error.message });
    }
};

const getClassTimetable = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const class_id = req.params.id;
        const academic_year = req.query.academic_year || '2026-2027';

        const classObj = await Class.findById(class_id).populate('class_incharge_id');
        const settings = await TimetableSettings.findOne({ school_id, academic_year }) || {};
        const timetable = await Timetable.findOne({ school_id, class_id, academic_year }).populate('schedule.subject_id schedule.teacher_id');
        const assignments = await TeacherAssignment.find({ school_id, class_id, academic_year }).populate('teacher_id subject_id');

        res.json({ classObj, settings, timetable, assignments });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch class timetable', error: error.message });
    }
};

const saveClassTimetable = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const { class_id, academic_year = '2026-2027', schedule, status = 'Draft' } = req.body;
        const timetable = await Timetable.findOneAndUpdate(
            { school_id, class_id, academic_year },
            { school_id, class_id, academic_year, status, schedule },
            { upsert: true, new: true }
        );
        res.json({ message: 'Timetable saved', timetable });
    } catch (error) {
        res.status(500).json({ message: 'Failed to save timetable', error: error.message });
    }
};

const getTeacherTimetable = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const teacher_id = req.params.id;
        const academic_year = req.query.academic_year || '2026-2027';

        const teacher = await Teacher.findById(teacher_id);
        const timetables = await Timetable.find({ school_id, academic_year }).populate('class_id schedule.subject_id');

        const schedule = [];
        let totalPeriods = 0;

        timetables.forEach(tt => {
            (tt.schedule || []).forEach(slot => {
                if (slot.teacher_id && slot.teacher_id.toString() === teacher_id.toString()) {
                    totalPeriods++;
                    schedule.push({
                        day: slot.day,
                        period_name: slot.period_name,
                        className: tt.class_id ? `${tt.class_id.class}-${tt.class_id.section}` : '',
                        subject_name: slot.subject_id?.name || 'Subject'
                    });
                }
            });
        });

        res.json({ teacher, totalPeriods, maxAllowed: 36, workloadStatus: totalPeriods > 36 ? 'OVERLOADED' : 'OK', schedule });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch teacher schedule', error: error.message });
    }
};

const getGlobalTimetable = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const academic_year = req.query.academic_year || '2026-2027';

        const classes = await Class.find({ school_id });
        const timetables = await Timetable.find({ school_id, academic_year }).populate('class_id schedule.subject_id schedule.teacher_id');
        const settings = await TimetableSettings.findOne({ school_id, academic_year }) || {};
        const conflicts = await detectConflicts(school_id, academic_year, false);

        res.json({ classes, timetables, settings, conflicts });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch global timetable', error: error.message });
    }
};

const checkConflicts = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const academic_year = req.body.academic_year || '2026-2027';
        const conflicts = await detectConflicts(school_id, academic_year, true);
        res.json({ count: conflicts.length, conflicts });
    } catch (error) {
        res.status(500).json({ message: 'Failed to check conflicts', error: error.message });
    }
};

const autoGenerate = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const { academic_year = '2026-2027', class_ids } = req.body;
        const results = await generateTimetables(school_id, academic_year, class_ids);
        res.json({ message: 'Timetable auto-generated successfully!', count: results.length, timetables: results });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Auto generation failed' });
    }
};

const getAssignments = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const assignments = await TeacherAssignment.find({ school_id }).populate('teacher_id subject_id class_id');
        const classSubjects = await ClassSubject.find({ school_id }).populate('teacher_id subject_id class_id');
        res.json([...assignments, ...classSubjects]);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch assignments', error: error.message });
    }
};

const saveAssignment = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const assignment = await TeacherAssignment.findOneAndUpdate(
            { school_id, class_id: req.body.class_id, subject_id: req.body.subject_id },
            { ...req.body, school_id },
            { upsert: true, new: true }
        );
        res.json({ message: 'Assignment saved', assignment });
    } catch (error) {
        res.status(500).json({ message: 'Failed to save assignment', error: error.message });
    }
};

const deleteAssignment = async (req, res) => {
    try {
        await TeacherAssignment.findByIdAndDelete(req.params.id);
        res.json({ message: 'Assignment deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete assignment', error: error.message });
    }
};

const getTeacherAvailability = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const availabilities = await TeacherAvailability.find({ school_id }).populate('teacher_id');
        res.json(availabilities);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch availability', error: error.message });
    }
};

const saveTeacherAvailability = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const availability = await TeacherAvailability.findOneAndUpdate(
            { school_id, teacher_id: req.body.teacher_id },
            { ...req.body, school_id },
            { upsert: true, new: true }
        );
        res.json({ message: 'Availability saved', availability });
    } catch (error) {
        res.status(500).json({ message: 'Failed to save availability', error: error.message });
    }
};

const getStudentTimetable = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const class_id = req.query.class_id;
        const timetable = await Timetable.findOne({ school_id, class_id }).populate('schedule.subject_id schedule.teacher_id');
        const classObj = await Class.findById(class_id).populate('class_incharge_id');
        res.json({ classObj, timetable });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch student timetable', error: error.message });
    }
};

const updatePeriodTiming = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const { id } = req.params;
        const { period_name, start_time, end_time, is_lunch, is_break, type } = req.body;

        if (!period_name || !start_time || !end_time) {
            return res.status(400).json({ message: 'Period name, start time, and end time are required' });
        }

        // Validate time range: end_time > start_time
        const parseTimeToMinutes = (timeStr) => {
            if (!timeStr || typeof timeStr !== 'string') return null;
            const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
            if (!match) return null;
            let hrs = parseInt(match[1], 10);
            const mins = parseInt(match[2], 10);
            const ampm = match[3] ? match[3].toUpperCase() : null;
            if (ampm === 'PM' && hrs < 12) hrs += 12;
            if (ampm === 'AM' && hrs === 12) hrs = 0;
            return hrs * 60 + mins;
        };

        const startMins = parseTimeToMinutes(start_time);
        const endMins = parseTimeToMinutes(end_time);
        if (startMins !== null && endMins !== null && endMins <= startMins) {
            return res.status(400).json({
                message: `Invalid timing: End time (${end_time}) must be later than start time (${start_time}).`
            });
        }

        // Check if id is a PeriodConfig or update PeriodConfig
        let periodConfig = null;
        if (mongoose.Types.ObjectId.isValid(id)) {
            periodConfig = await PeriodConfig.findOne({ _id: id, school_id });
        }
        if (!periodConfig) {
            periodConfig = await PeriodConfig.findOne({ school_id, period_name });
        }

        if (periodConfig) {
            periodConfig.period_name = period_name;
            periodConfig.start_time = start_time;
            periodConfig.end_time = end_time;
            if (typeof is_lunch === 'boolean') periodConfig.is_lunch = is_lunch;
            if (typeof is_break === 'boolean') periodConfig.is_break = is_break;
            if (type) periodConfig.type = type;
            await periodConfig.save();
        }

        // Also update in TimetableSettings.generated_periods
        const settings = await TimetableSettings.findOne({ school_id });
        if (settings && settings.generated_periods) {
            let matched = false;
            settings.generated_periods = settings.generated_periods.map(p => {
                const pObj = p.toObject ? p.toObject() : p;
                if ((pObj._id && pObj._id.toString() === id.toString()) || pObj.period_name === period_name) {
                    matched = true;
                    return {
                        ...pObj,
                        period_name,
                        start_time,
                        end_time,
                        is_lunch: typeof is_lunch === 'boolean' ? is_lunch : pObj.is_lunch,
                        is_break: typeof is_break === 'boolean' ? is_break : pObj.is_break,
                        type: type || pObj.type
                    };
                }
                return pObj;
            });
            if (matched) {
                await settings.save();
            }
        }

        res.json({
            message: 'Period timing updated successfully',
            period: periodConfig || { period_name, start_time, end_time, is_lunch, is_break, type }
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update period timing', error: error.message });
    }
};

module.exports = {
    getAllTimetables,
    getClassTimetableBySection,
    getTeacherTimetableByTeacherId,
    createTimetable,
    updateTimetable,
    deleteTimetable,
    getPrintTimetable,
    getDashboardStats,
    getSettings,
    saveSettings,
    getClasses,
    getClassTimetable,
    saveClassTimetable,
    getTeacherTimetable,
    getGlobalTimetable,
    checkConflicts,
    autoGenerate,
    getAssignments,
    saveAssignment,
    deleteAssignment,
    getTeacherAvailability,
    saveTeacherAvailability,
    getStudentTimetable,
    updatePeriodTiming
};
