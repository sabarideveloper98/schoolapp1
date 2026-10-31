const Student = require('../models/Student');
const School = require('../models/School');

/**
 * Extracts a 4-digit year from academic_year string (e.g. "2025-2026" -> "2025")
 * or falls back to current calendar year.
 */
const extractYear = (academicYear) => {
    if (academicYear) {
        const match = String(academicYear).match(/\b(20\d{2})\b/);
        if (match) return match[1];
    }
    return String(new Date().getFullYear());
};

/**
 * Generates one or more unique Admission Numbers for a school.
 * Follows existing school-specific format (e.g. ADM20250001, ADM10001, etc.).
 *
 * @param {string|ObjectId} schoolId - School ID
 * @param {string} [academicYear] - Academic year (e.g. "2025-2026")
 * @param {number} [count=1] - Number of admission numbers to generate
 * @param {Set<string>} [reservedSet=new Set()] - Set of already reserved admission numbers in the current session
 * @returns {Promise<string[]>} Array of generated unique admission numbers
 */
const generateAdmissionNumbers = async (schoolId, academicYear = '', count = 1, reservedSet = new Set()) => {
    const year = extractYear(academicYear);

    // Fetch all existing admission numbers for this school
    const existingStudents = await Student.find({ school_id: schoolId })
        .select('admission_number')
        .lean();

    const existingSet = new Set(reservedSet);
    const existingAdmissions = [];

    existingStudents.forEach(st => {
        if (st.admission_number && String(st.admission_number).trim()) {
            const val = String(st.admission_number).trim();
            existingSet.add(val);
            existingAdmissions.push(val);
        }
    });

    // Detect format pattern from existing admission numbers
    // 1. Check if school has admission numbers starting with ADM + year (e.g. ADM20250180)
    const yearPattern = new RegExp(`^ADM${year}(\\d+)$`, 'i');
    const yearMatches = [];

    // 2. Check if school has ADM + digits without year (e.g. ADM10010)
    const admPattern = /^ADM(\d+)$/i;
    const admMatches = [];

    // 3. Any prefix + digits
    const genericPattern = /^([A-Z]+)(\d+)$/i;
    const genericMatches = [];

    existingAdmissions.forEach(adm => {
        const yMatch = adm.match(yearPattern);
        if (yMatch) {
            yearMatches.push(parseInt(yMatch[1], 10));
        }

        const aMatch = adm.match(admPattern);
        if (aMatch) {
            admMatches.push(parseInt(aMatch[1], 10));
        }

        const gMatch = adm.match(genericPattern);
        if (gMatch) {
            genericMatches.push({ prefix: gMatch[1].toUpperCase(), num: parseInt(gMatch[2], 10), raw: gMatch[2] });
        }
    });

    const generated = [];

    if (yearMatches.length > 0) {
        // Increment within ADM + year format
        let nextSeq = Math.max(...yearMatches) + 1;
        while (generated.length < count) {
            const candidate = `ADM${year}${String(nextSeq).padStart(4, '0')}`;
            if (!existingSet.has(candidate)) {
                existingSet.add(candidate);
                generated.push(candidate);
            }
            nextSeq++;
        }
    } else if (admMatches.length > 0 && genericMatches.some(g => g.prefix === 'ADM' && g.raw.length <= 6)) {
        // Increment within ADM + number format (like ADM10001)
        let nextSeq = Math.max(...admMatches) + 1;
        while (generated.length < count) {
            const candidate = `ADM${String(nextSeq).padStart(5, '0')}`;
            if (!existingSet.has(candidate)) {
                existingSet.add(candidate);
                generated.push(candidate);
            }
            nextSeq++;
        }
    } else {
        // Default standard format: ADM + year + 4-digit sequence (e.g. ADM20260001 or ADM20250001)
        let nextSeq = 1;
        // Check if there are any existing numbers of this year format to avoid starting at 1 if some were deleted
        while (generated.length < count) {
            const candidate = `ADM${year}${String(nextSeq).padStart(4, '0')}`;
            if (!existingSet.has(candidate)) {
                existingSet.add(candidate);
                generated.push(candidate);
            }
            nextSeq++;
        }
    }

    return generated;
};

/**
 * Generates one or more unique Roll Numbers for a specific class & section in an academic year.
 *
 * @param {string|ObjectId} schoolId - School ID
 * @param {string} academicYear - Academic year (e.g. "2025-2026")
 * @param {string} className - Class name (e.g. "1", "10", "L.K.G")
 * @param {string} sectionName - Section name (e.g. "A", "B")
 * @param {number} [count=1] - Number of roll numbers to generate
 * @param {Set<string>} [reservedSet=new Set()] - Set of already reserved roll numbers in the current session
 * @returns {Promise<string[]>} Array of generated unique roll numbers
 */
const generateRollNumbers = async (schoolId, academicYear, className, sectionName, count = 1, reservedSet = new Set()) => {
    const cleanClass = String(className || '').trim();
    const cleanSection = String(sectionName || '').trim();
    const cleanYear = String(academicYear || '').trim();

    // Query all students in this class (all sections) for this academic year
    const classStudents = await Student.find({
        school_id: schoolId,
        academic_year: cleanYear,
        class: cleanClass
    }).select('roll_no section').lean();

    const existingSectionRolls = new Set(reservedSet);
    const numericRolls = [];
    const allClassNumericRolls = [];

    classStudents.forEach(st => {
        const rollStr = String(st.roll_no || '').trim();
        if (!rollStr) return;

        const numVal = parseInt(rollStr, 10);
        if (!isNaN(numVal) && String(numVal) === rollStr) {
            allClassNumericRolls.push(numVal);
            if (String(st.section || '').trim().toUpperCase() === cleanSection.toUpperCase()) {
                existingSectionRolls.add(rollStr);
                numericRolls.push(numVal);
            }
        } else {
            // Non-pure numeric roll (e.g. LKGA101)
            if (String(st.section || '').trim().toUpperCase() === cleanSection.toUpperCase()) {
                existingSectionRolls.add(rollStr);
            }
        }
    });

    let nextRollNum;

    if (numericRolls.length > 0) {
        // Section has existing numeric roll numbers -> max + 1
        nextRollNum = Math.max(...numericRolls) + 1;
    } else if (allClassNumericRolls.length > 0) {
        // Section is empty, but other sections of this class exist -> class max + 1
        nextRollNum = Math.max(...allClassNumericRolls) + 1;
    } else {
        // Brand new class with no students yet in this academic year
        const classInt = parseInt(cleanClass, 10);
        if (!isNaN(classInt) && classInt >= 1 && classInt <= 12) {
            nextRollNum = classInt * 100 + 1; // e.g. Class 1 -> 101, Class 2 -> 201, Class 10 -> 1001
        } else {
            nextRollNum = 101; // Default for non-numeric classes like L.K.G, U.K.G
        }
    }

    const generated = [];
    while (generated.length < count) {
        const candidate = String(nextRollNum);
        if (!existingSectionRolls.has(candidate)) {
            existingSectionRolls.add(candidate);
            generated.push(candidate);
        }
        nextRollNum++;
    }

    return generated;
};

/**
 * Automatically populates missing admission numbers and roll numbers for an array of students.
 * Preserves existing values if already provided.
 *
 * @param {string|ObjectId} schoolId - School ID
 * @param {Array<Object>} studentsList - List of student objects
 * @returns {Promise<Array<Object>>} List of students with generated admission numbers and roll numbers
 */
const assignNumbersForStudents = async (schoolId, studentsList) => {
    if (!Array.isArray(studentsList) || studentsList.length === 0) {
        return [];
    }

    // 1. Collect all explicitly provided admission numbers to avoid collisions
    const reservedAdmissions = new Set();
    studentsList.forEach(st => {
        const adm = String(st.admission_number || st.admission_no || '').trim();
        if (adm) reservedAdmissions.add(adm);
    });

    // 2. Identify students needing an admission number
    const needsAdmission = [];
    studentsList.forEach((st, idx) => {
        const adm = String(st.admission_number || st.admission_no || '').trim();
        if (!adm) {
            needsAdmission.push(idx);
        }
    });

    if (needsAdmission.length > 0) {
        const sampleYear = studentsList[0]?.academic_year || '';
        const generatedAdmissions = await generateAdmissionNumbers(
            schoolId,
            sampleYear,
            needsAdmission.length,
            reservedAdmissions
        );

        needsAdmission.forEach((studentIdx, i) => {
            studentsList[studentIdx].admission_number = generatedAdmissions[i];
            if ('admission_no' in studentsList[studentIdx]) {
                studentsList[studentIdx].admission_no = generatedAdmissions[i];
            }
        });
    }

    // 3. Group students needing roll numbers by (academic_year, class, section)
    const rollGroups = new Map(); // key -> array of student indices
    const groupReservedRolls = new Map(); // key -> Set of provided roll numbers

    studentsList.forEach((st, idx) => {
        const key = `${st.academic_year || 'Default'}|${st.class || st.className || 'Default'}|${st.section || 'A'}`;
        if (!groupReservedRolls.has(key)) {
            groupReservedRolls.set(key, new Set());
        }

        const roll = String(st.roll_no || '').trim();
        if (roll) {
            groupReservedRolls.get(key).add(roll);
        } else {
            if (!rollGroups.has(key)) {
                rollGroups.set(key, []);
            }
            rollGroups.get(key).push(idx);
        }
    });

    // 4. Generate roll numbers for each group
    for (const [key, indices] of rollGroups.entries()) {
        const [year, cls, sec] = key.split('|');
        const reservedSet = groupReservedRolls.get(key) || new Set();

        const generatedRolls = await generateRollNumbers(
            schoolId,
            year,
            cls,
            sec,
            indices.length,
            reservedSet
        );

        indices.forEach((studentIdx, i) => {
            studentsList[studentIdx].roll_no = generatedRolls[i];
        });
    }

    return studentsList;
};

module.exports = {
    generateAdmissionNumbers,
    generateRollNumbers,
    assignNumbersForStudents,
    extractYear
};
