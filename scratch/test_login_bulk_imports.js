// scratch/test_login_bulk_imports.js
const fs = require('fs');
const path = require('path');

// Robust RFC4180 CSV line parser
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
  return lines.map(parseCSVLine);
}

function checkForDuplicates(headers, moduleName) {
  const seen = new Set();
  const duplicates = [];
  headers.forEach(h => {
    const lower = h.toLowerCase().trim().replace(/[\s_]/g, '');
    if (seen.has(lower)) {
      duplicates.push(h);
    }
    seen.add(lower);
  });
  if (duplicates.length > 0) {
    throw new Error(`[${moduleName}] DUPLICATE COLUMNS FOUND: ${duplicates.join(', ')}`);
  }
}

// 1. Test Student Bulk Import Fields
const studentFileContent = fs.readFileSync(path.join(__dirname, '../frontend/src/components/BulkStudentImportModal.jsx'), 'utf8');
const studentFieldsMatch = studentFileContent.match(/export const ALL_STUDENT_FIELDS = (\[[\s\S]*?\]);/);
if (!studentFieldsMatch) throw new Error('Could not extract ALL_STUDENT_FIELDS');
const ALL_STUDENT_FIELDS = eval(studentFieldsMatch[1]);

// 2. Test Teacher Bulk Import Fields
const teacherFileContent = fs.readFileSync(path.join(__dirname, '../frontend/src/components/BulkTeacherImportModal.jsx'), 'utf8');
const teacherFieldsMatch = teacherFileContent.match(/export const ALL_TEACHER_FIELDS = (\[[\s\S]*?\]);/);
if (!teacherFieldsMatch) throw new Error('Could not extract ALL_TEACHER_FIELDS');
const ALL_TEACHER_FIELDS = eval(teacherFieldsMatch[1]);

// 3. Test Staff Bulk Import Fields
const staffFileContent = fs.readFileSync(path.join(__dirname, '../frontend/src/components/BulkStaffImportModal.jsx'), 'utf8');
const staffFieldsMatch = staffFileContent.match(/export const ALL_STAFF_FIELDS = (\[[\s\S]*?\]);/);
if (!staffFieldsMatch) throw new Error('Could not extract ALL_STAFF_FIELDS');
const ALL_STAFF_FIELDS = eval(staffFieldsMatch[1]);

// 4. Test Marks Bulk Import Fields
const marksFileContent = fs.readFileSync(path.join(__dirname, '../frontend/src/components/BulkExamMarksImportModal.jsx'), 'utf8');
const marksFieldsMatch = marksFileContent.match(/export const ALL_MARKS_FIELDS = (\[[\s\S]*?\]);/);
if (!marksFieldsMatch) throw new Error('Could not extract ALL_MARKS_FIELDS');
const ALL_MARKS_FIELDS = eval(marksFieldsMatch[1]);

console.log('========================================================================');
console.log('TEST 1: STUDENT BULK IMPORT');
console.log('========================================================================');
const studentHeaders = ALL_STUDENT_FIELDS.map(f => f.key);
checkForDuplicates(studentHeaders, 'Student');
console.log(`Student total fields: ${studentHeaders.length}`);
const studentLoginPhone = ALL_STUDENT_FIELDS.find(f => f.key === 'guardian_phone');
const studentLoginEmail = ALL_STUDENT_FIELDS.find(f => f.key === 'guardian_email');
const studentLoginPassword = ALL_STUDENT_FIELDS.find(f => f.key === 'password');
console.log('Login Phone present:', studentLoginPhone ? `YES (${studentLoginPhone.key})` : 'NO');
console.log('Login Email present:', studentLoginEmail ? `YES (${studentLoginEmail.key})` : 'NO');
console.log('Login Password present:', studentLoginPassword ? `YES (${studentLoginPassword.key})` : 'NO');
if (!studentLoginPhone || !studentLoginEmail || !studentLoginPassword) {
  throw new Error('Student is missing required login detail columns!');
}
console.log('Student fields duplicate check PASSED!');

console.log('\n========================================================================');
console.log('TEST 2: TEACHER BULK IMPORT');
console.log('========================================================================');
const teacherHeaders = ALL_TEACHER_FIELDS.map(f => f.key);
checkForDuplicates(teacherHeaders, 'Teacher');
console.log(`Teacher total fields: ${teacherHeaders.length}`);
const teacherLoginEmail = ALL_TEACHER_FIELDS.find(f => f.key === 'email');
const teacherLoginMobile = ALL_TEACHER_FIELDS.find(f => f.key === 'mobile');
const teacherLoginPassword = ALL_TEACHER_FIELDS.find(f => f.key === 'password');
console.log('Login Email present:', teacherLoginEmail ? `YES (${teacherLoginEmail.key})` : 'NO');
console.log('Login Mobile present:', teacherLoginMobile ? `YES (${teacherLoginMobile.key})` : 'NO');
console.log('Login Password present:', teacherLoginPassword ? `YES (${teacherLoginPassword.key})` : 'NO');
if (!teacherLoginEmail || !teacherLoginMobile || !teacherLoginPassword) {
  throw new Error('Teacher is missing required login detail columns!');
}
console.log('Teacher fields duplicate check PASSED!');

console.log('\n========================================================================');
console.log('TEST 3: STAFF BULK IMPORT');
console.log('========================================================================');
const staffHeaders = ALL_STAFF_FIELDS.map(f => f.key);
checkForDuplicates(staffHeaders, 'Staff');
console.log(`Staff total fields: ${staffHeaders.length}`);
const staffLoginEmail = ALL_STAFF_FIELDS.find(f => f.key === 'email');
const staffLoginPhone = ALL_STAFF_FIELDS.find(f => f.key === 'phone');
const staffLoginPassword = ALL_STAFF_FIELDS.find(f => f.key === 'password');
console.log('Login Email present:', staffLoginEmail ? `YES (${staffLoginEmail.key})` : 'NO');
console.log('Login Phone present:', staffLoginPhone ? `YES (${staffLoginPhone.key})` : 'NO');
console.log('Login Password present:', staffLoginPassword ? `YES (${staffLoginPassword.key})` : 'NO');
if (!staffLoginEmail || !staffLoginPhone || !staffLoginPassword) {
  throw new Error('Staff is missing required login detail columns!');
}
console.log('Staff fields duplicate check PASSED!');

console.log('\n========================================================================');
console.log('TEST 4: MARKS BULK IMPORT');
console.log('========================================================================');
const marksHeaders = ALL_MARKS_FIELDS.map(f => f.key);
checkForDuplicates(marksHeaders, 'Marks');
console.log(`Marks total fields: ${marksHeaders.length}`);
console.log('Marks fields duplicate check PASSED!');

console.log('\n========================================================================');
console.log('ALL TESTS PASSED SUCCESSFULLY! ZERO DUPLICATES, COMPLETE LOGIN FIELDS.');
console.log('========================================================================');
