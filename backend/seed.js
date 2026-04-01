const db = require('./db');

async function seed() {
  let connection;
  try {
    await db.initialize();
    connection = await db.getConnection();

    console.log('🌱 Starting seed process...\n');

    // ─── Create Sequence for Student IDs ───
    try {
      await connection.execute('DROP SEQUENCE STUDENT_SEQ');
    } catch (e) { /* Sequence doesn't exist yet */ }
    await connection.execute('CREATE SEQUENCE STUDENT_SEQ START WITH 1001 INCREMENT BY 1');
    console.log('✅ STUDENT_SEQ sequence created (starts at 1001)');

    // ─── Seed Centers ───
    const centers = [
      [1, 'Delhi Public School Center', 'New Delhi'],
      [2, 'Mumbai Central Exam Hall', 'Mumbai'],
      [3, 'Bangalore IISC Center', 'Bangalore'],
      [4, 'Chennai Anna University Center', 'Chennai'],
      [5, 'Kolkata Jadavpur Center', 'Kolkata'],
      [6, 'Hyderabad HITEC City Center', 'Hyderabad'],
      [7, 'Pune MIT Center', 'Pune'],
      [8, 'Ahmedabad IIM Center', 'Ahmedabad'],
      [9, 'Jaipur University Center', 'Jaipur'],
      [10, 'Lucknow IET Center', 'Lucknow']
    ];

    for (const [id, name, city] of centers) {
      try {
        await connection.execute(
          'INSERT INTO CENTER (CENTER_ID, CENTER_NAME, CENTER_CITY) VALUES (:1, :2, :3)',
          [id, name, city]
        );
      } catch (e) {
        if (e.errorNum === 1) continue; // Already exists
        throw e;
      }
    }
    console.log('✅ 10 Centers seeded');

    // ─── Seed Exams ───
    const exams = [
      ['JEE001', 'JEE Main', 300],
      ['JEE002', 'JEE Advanced', 360],
      ['NEET01', 'NEET UG', 720],
      ['GATE01', 'GATE CS', 100],
      ['CAT001', 'CAT MBA', 228]
    ];

    for (const [code, name, marks] of exams) {
      try {
        await connection.execute(
          'INSERT INTO EXAM (EXAM_CODE, EXAM_NAME, TOTAL_MARKS) VALUES (:1, :2, :3)',
          [code, name, marks]
        );
      } catch (e) {
        if (e.errorNum === 1) continue;
        throw e;
      }
    }
    console.log('✅ 5 Exams seeded');

    // ─── Seed Exam Sessions ───
    const sessions = [
      [101, 'JEE001', 'Phase 1', 'Morning', '2026-01-20'],
      [102, 'JEE001', 'Phase 1', 'Afternoon', '2026-01-20'],
      [103, 'JEE001', 'Phase 2', 'Morning', '2026-01-25'],
      [104, 'JEE002', 'Phase 1', 'Morning', '2026-06-15'],
      [105, 'JEE002', 'Phase 1', 'Afternoon', '2026-06-15'],
      [106, 'NEET01', 'Phase 1', 'Morning', '2026-05-01'],
      [107, 'NEET01', 'Phase 1', 'Afternoon', '2026-05-01'],
      [108, 'GATE01', 'Phase 1', 'Morning', '2026-02-10'],
      [109, 'GATE01', 'Phase 2', 'Morning', '2026-02-17'],
      [110, 'CAT001', 'Phase 1', 'Morning', '2026-11-15']
    ];

    for (const [id, code, phase, shift, date] of sessions) {
      try {
        await connection.execute(
          `INSERT INTO EXAM_SESSION (SESSION_ID, EXAM_CODE, PHASE, SHIFT, EXAM_DATE)
           VALUES (:1, :2, :3, :4, TO_DATE(:5, 'YYYY-MM-DD'))`,
          [id, code, phase, shift, date]
        );
      } catch (e) {
        if (e.errorNum === 1) continue;
        throw e;
      }
    }
    console.log('✅ 10 Exam Sessions seeded');

    // ─── Seed Colleges ───
    const colleges = [
      [1, 'IIT Bombay', 'Mumbai'],
      [2, 'IIT Delhi', 'New Delhi'],
      [3, 'IIT Madras', 'Chennai'],
      [4, 'IIT Kanpur', 'Kanpur'],
      [5, 'NIT Trichy', 'Tiruchirappalli'],
      [6, 'NIT Warangal', 'Warangal'],
      [7, 'BITS Pilani', 'Pilani'],
      [8, 'IIT Kharagpur', 'Kharagpur']
    ];

    for (const [id, name, city] of colleges) {
      try {
        await connection.execute(
          'INSERT INTO COLLEGE (COLLEGE_ID, COLLEGE_NAME, COLLEGE_CITY) VALUES (:1, :2, :3)',
          [id, name, city]
        );
      } catch (e) {
        if (e.errorNum === 1) continue;
        throw e;
      }
    }
    console.log('✅ 8 Colleges seeded');

    // ─── Seed Branches ───
    const branches = [
      ['CS', 'Computer Science & Engineering'],
      ['EC', 'Electronics & Communication'],
      ['ME', 'Mechanical Engineering'],
      ['EE', 'Electrical Engineering'],
      ['CE', 'Civil Engineering'],
      ['CH', 'Chemical Engineering'],
      ['IT', 'Information Technology'],
      ['BT', 'Biotechnology']
    ];

    for (const [code, name] of branches) {
      try {
        await connection.execute(
          'INSERT INTO BRANCH (BRANCH_CODE, BRANCH_NAME) VALUES (:1, :2)',
          [code, name]
        );
      } catch (e) {
        if (e.errorNum === 1) continue;
        throw e;
      }
    }
    console.log('✅ 8 Branches seeded');

    // ─── Seed Sample Students ───
    const students = [
      [1001, 'Aarav', 'Sharma', 'aarav.sharma@email.com', '2005-03-15', '12 MG Road', 'New Delhi', 'Delhi', 'General', 1],
      [1002, 'Priya', 'Patel', 'priya.patel@email.com', '2004-07-22', '45 Park Street', 'Mumbai', 'Maharashtra', 'OBC', 2],
      [1003, 'Rohan', 'Gupta', 'rohan.gupta@email.com', '2005-11-08', '78 Brigade Road', 'Bangalore', 'Karnataka', 'General', 3],
      [1004, 'Sneha', 'Reddy', 'sneha.reddy@email.com', '2004-01-30', '23 Anna Salai', 'Chennai', 'Tamil Nadu', 'SC', 4],
      [1005, 'Arjun', 'Singh', 'arjun.singh@email.com', '2005-09-12', '56 Salt Lake', 'Kolkata', 'West Bengal', 'General', 5]
    ];

    // Update sequence to avoid conflicts
    try {
      await connection.execute('DROP SEQUENCE STUDENT_SEQ');
    } catch (e) { }
    await connection.execute('CREATE SEQUENCE STUDENT_SEQ START WITH 1006 INCREMENT BY 1');

    for (const [id, fname, lname, email, dob, street, city, state, cat, cid] of students) {
      try {
        await connection.execute(
          `INSERT INTO STUDENT (STUDENT_ID, FIRST_NAME, LAST_NAME, EMAIL, DOB, STREET, CITY, STATE, CATEGORY, CENTER_ID)
           VALUES (:1, :2, :3, :4, TO_DATE(:5, 'YYYY-MM-DD'), :6, :7, :8, :9, :10)`,
          [id, fname, lname, email, dob, street, city, state, cat, cid]
        );
      } catch (e) {
        if (e.errorNum === 1) continue;
        throw e;
      }
    }
    console.log('✅ 5 Students seeded');

    // ─── Seed Phone Numbers ───
    const phones = [
      [1001, '9876543210'], [1001, '9876543211'],
      [1002, '8765432109'],
      [1003, '7654321098'], [1003, '7654321099'],
      [1004, '6543210987'],
      [1005, '5432109876']
    ];

    for (const [sid, phone] of phones) {
      try {
        await connection.execute(
          'INSERT INTO STUDENT_PHONE (STUDENT_ID, PHONE_NUMBER) VALUES (:1, :2)',
          [sid, phone]
        );
      } catch (e) {
        if (e.errorNum === 1) continue;
        throw e;
      }
    }
    console.log('✅ Phone numbers seeded');

    // ─── Seed Registrations ───
    const registrations = [
      [1001, 101, '2025-12-01'],
      [1001, 104, '2025-12-15'],
      [1002, 101, '2025-12-02'],
      [1002, 106, '2025-12-10'],
      [1003, 102, '2025-12-03'],
      [1004, 106, '2025-12-05'],
      [1004, 108, '2025-12-08'],
      [1005, 103, '2025-12-04']
    ];

    for (const [sid, ssid, date] of registrations) {
      try {
        await connection.execute(
          `INSERT INTO REGISTRATION (STUDENT_ID, SESSION_ID, REGISTRATION_DATE)
           VALUES (:1, :2, TO_DATE(:3, 'YYYY-MM-DD'))`,
          [sid, ssid, date]
        );
      } catch (e) {
        if (e.errorNum === 1) continue;
        throw e;
      }
    }
    console.log('✅ 8 Registrations seeded');

    // ─── Seed Results ───
    const results = [
      [1001, 101, 245, 98.5],
      [1002, 101, 198, 89.2],
      [1003, 102, 267, 99.1],
      [1004, 106, 625, 95.8],
      [1005, 103, 210, 91.4],
      [1001, 104, 310, 97.2]
    ];

    for (const [sid, ssid, score, pct] of results) {
      try {
        await connection.execute(
          'INSERT INTO RESULT (STUDENT_ID, SESSION_ID, SCORE, PERCENTILE) VALUES (:1, :2, :3, :4)',
          [sid, ssid, score, pct]
        );
      } catch (e) {
        if (e.errorNum === 1) continue;
        throw e;
      }
    }
    console.log('✅ 6 Results seeded');

    // ─── Seed Grievances ───
    const grievances = [
      [1001, 1, 'Score Discrepancy', 'My score seems lower than expected. Please verify.', 'Open'],
      [1002, 1, 'Technical Issue', 'System crashed during my exam session.', 'Under Review'],
      [1004, 1, 'Center Issue', 'The exam center was changed without notice.', 'Resolved']
    ];

    for (const [sid, tno, type, desc, status] of grievances) {
      try {
        await connection.execute(
          'INSERT INTO GRIEVANCE (STUDENT_ID, TICKET_NO, ISSUE_TYPE, DESCRIPTION, STATUS) VALUES (:1, :2, :3, :4, :5)',
          [sid, tno, type, desc, status]
        );
      } catch (e) {
        if (e.errorNum === 1) continue;
        throw e;
      }
    }
    console.log('✅ 3 Grievances seeded');

    // ─── Seed Allotments ───
    const allotments = [
      [1001, 1, 1, 'CS', 'General', 'Accepted'],
      [1003, 1, 2, 'CS', 'General', 'Accepted'],
      [1003, 2, 1, 'EC', 'General', 'Upgraded'],
      [1004, 1, 5, 'BT', 'SC', 'Accepted'],
      [1005, 1, 7, 'ME', 'General', 'Not Accepted']
    ];

    for (const [sid, rnd, cid, bcode, cat, status] of allotments) {
      try {
        await connection.execute(
          `INSERT INTO ALLOTMENT (STUDENT_ID, ROUND_NO, COLLEGE_ID, BRANCH_CODE, ALLOCATED_CATEGORY, STATUS)
           VALUES (:1, :2, :3, :4, :5, :6)`,
          [sid, rnd, cid, bcode, cat, status]
        );
      } catch (e) {
        if (e.errorNum === 1) continue;
        throw e;
      }
    }
    console.log('✅ 5 Allotments seeded');

    await connection.commit();
    console.log('\n🎉 All seed data inserted successfully!');

  } catch (err) {
    console.error('❌ Seed error:', err.message);
    if (connection) await connection.rollback();
  } finally {
    if (connection) await connection.close();
    await db.close();
  }
}

seed();
