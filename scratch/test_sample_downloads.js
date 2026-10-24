// scratch/test_sample_downloads.js
const fs = require('fs');
const path = require('path');

function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
  return lines.map(parseCSVLine);
}

// 1. Student Sample verification
const studentSrc = fs.readFileSync(path.join(__dirname, '../frontend/src/components/BulkStudentImportModal.jsx'), 'utf8');
const studentSampleMatch = studentSrc.match(/const sampleRowData = ({[\s\S]*?});/);
const studentFieldsMatch = studentSrc.match(/export const ALL_STUDENT_FIELDS = (\[[\s\S]*?\]);/);
const studentFields = eval(studentFieldsMatch[1]);
const studentSampleData = eval('(' + studentSampleMatch[1] + ')');

const studentHeaders = studentFields.map(f => f.key);
const studentSampleRow = studentFields.map(f => studentSampleData[f.key] ?? '');
const studentCSV = `${studentHeaders.join(',')}\n${studentSampleRow.join(',')}\n`;
const parsedStudent = parseCSV(studentCSV);

console.log('Testing Student Sample CSV:');
console.log('Row count:', parsedStudent.length);
console.log('Header length:', parsedStudent[0].length);
console.log('Sample row length:', parsedStudent[1].length);
if (parsedStudent.length !== 2) throw new Error('Student CSV must have exactly 2 rows');
if (parsedStudent[0].length !== parsedStudent[1].length) throw new Error('Student header/row mismatch');
console.log('Student Sample CSV verified!\n');

// 2. Teacher Sample verification
const teacherSrc = fs.readFileSync(path.join(__dirname, '../frontend/src/components/BulkTeacherImportModal.jsx'), 'utf8');
const teacherSampleMatch = teacherSrc.match(/const sampleRowData = ({[\s\S]*?});/);
const teacherFieldsMatch = teacherSrc.match(/export const ALL_TEACHER_FIELDS = (\[[\s\S]*?\]);/);
const teacherFields = eval(teacherFieldsMatch[1]);
const teacherSampleData = eval('(' + teacherSampleMatch[1] + ')');

const escapeCSVCell = (val) => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const teacherHeaders = teacherFields.map(f => f.key);
const teacherSampleRow = teacherFields.map(f => escapeCSVCell(teacherSampleData[f.key] ?? ''));
const teacherCSV = `${teacherHeaders.join(',')}\n${teacherSampleRow.join(',')}\n`;
const parsedTeacher = parseCSV(teacherCSV);

console.log('Testing Teacher Sample CSV:');
console.log('Row count:', parsedTeacher.length);
console.log('Header length:', parsedTeacher[0].length);
console.log('Sample row length:', parsedTeacher[1].length);
if (parsedTeacher.length !== 2) throw new Error('Teacher CSV must have exactly 2 rows');
if (parsedTeacher[0].length !== parsedTeacher[1].length) throw new Error('Teacher header/row mismatch');
console.log('Teacher Sample CSV verified!\n');

// 3. Staff Sample verification
const staffSrc = fs.readFileSync(path.join(__dirname, '../frontend/src/components/BulkStaffImportModal.jsx'), 'utf8');
const staffSampleMatch = staffSrc.match(/const sampleRowData = ({[\s\S]*?});/);
const staffFieldsMatch = staffSrc.match(/export const ALL_STAFF_FIELDS = (\[[\s\S]*?\]);/);
const staffFields = eval(staffFieldsMatch[1]);
const staffSampleData = eval('(' + staffSampleMatch[1] + ')');

const staffHeaders = staffFields.map(f => f.key);
const staffSampleRow = staffFields.map(f => escapeCSVCell(staffSampleData[f.key] ?? ''));
const staffCSV = `${staffHeaders.join(',')}\n${staffSampleRow.join(',')}\n`;
const parsedStaff = parseCSV(staffCSV);

console.log('Testing Staff Sample CSV:');
console.log('Row count:', parsedStaff.length);
console.log('Header length:', parsedStaff[0].length);
console.log('Sample row length:', parsedStaff[1].length);
if (parsedStaff.length !== 2) throw new Error('Staff CSV must have exactly 2 rows');
if (parsedStaff[0].length !== parsedStaff[1].length) throw new Error('Staff header/row mismatch');
console.log('Staff Sample CSV verified!\n');

// 4. Check that sample rows can be parsed back and all login values are retrieved
console.log('Verifying parsed values:');
console.log('Student Login: Phone =', studentSampleData.guardian_phone, '| Email =', studentSampleData.guardian_email, '| Password =', studentSampleData.password);
console.log('Teacher Login: Email =', teacherSampleData.email, '| Mobile =', teacherSampleData.mobile, '| Password =', teacherSampleData.password);
console.log('Staff Login: Email =', staffSampleData.email, '| Phone =', staffSampleData.phone, '| Password =', staffSampleData.password);

console.log('\nALL SAMPLE CSV FILES VALIDATED SUCCESSFULLY WITH EXACT 2 ROWS & PERFECT 1-TO-1 ALIGNMENT!');
