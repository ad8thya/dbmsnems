const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/register — Register student for exam session
router.post('/register', async (req, res) => {
  const { student_id, session_id } = req.body;
  const userRole = req.headers['x-user-role'];
  const loggedInStudentId = req.headers['x-student-id'];

  // If student role, enforce student_id must match logged in ID
  if (userRole === 'admin') {
    return res.status(403).json({ error: 'Admins cannot register students' });
  }

  if (userRole === 'student' && student_id.toString() !== loggedInStudentId.toString()) {
    return res.status(403).json({ error: 'You can only register for yourself' });
  }

  try {
    // Check if student exists
    const studentCheck = await db.execute(
      'SELECT STUDENT_ID FROM STUDENT WHERE STUDENT_ID = :id',
      [student_id]
    );
    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check if session exists
    const sessionCheck = await db.execute(
      'SELECT SESSION_ID FROM EXAM_SESSION WHERE SESSION_ID = :id',
      [session_id]
    );
    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Exam session not found' });
    }

    // Check if already registered
    const dupCheck = await db.execute(
      'SELECT * FROM REGISTRATION WHERE STUDENT_ID = :sid AND SESSION_ID = :ssid',
      [student_id, session_id]
    );
    if (dupCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Student is already registered for this session' });
    }

    await db.execute(
      `INSERT INTO REGISTRATION (STUDENT_ID, SESSION_ID, REGISTRATION_DATE)
       VALUES (:student_id, :session_id, SYSDATE)`,
      { student_id, session_id }
    );

    res.status(201).json({ message: 'Registration successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/registrations — Get all registrations (Admin) OR current student's
router.get('/registrations', async (req, res) => {
  const userRole = req.headers['x-user-role'];
  const loggedInStudentId = req.headers['x-student-id'];

  try {
    let query = `
      SELECT r.STUDENT_ID, r.SESSION_ID, 
             TO_CHAR(r.REGISTRATION_DATE, 'YYYY-MM-DD') AS REGISTRATION_DATE,
             es.PHASE, es.SHIFT, TO_CHAR(es.EXAM_DATE, 'YYYY-MM-DD') AS EXAM_DATE,
             e.EXAM_NAME, e.EXAM_CODE,
             s.FIRST_NAME, s.LAST_NAME
      FROM REGISTRATION r
      JOIN EXAM_SESSION es ON r.SESSION_ID = es.SESSION_ID
      JOIN EXAM e ON es.EXAM_CODE = e.EXAM_CODE
      JOIN STUDENT s ON r.STUDENT_ID = s.STUDENT_ID
    `;
    let params = [];

    if (userRole === 'student') {
      query += ' WHERE r.STUDENT_ID = :id';
      params.push(loggedInStudentId);
    }

    query += ' ORDER BY r.REGISTRATION_DATE DESC';
    const result = await db.execute(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/registrations/:student_id — Get registrations for a specific student
router.get('/registrations/:student_id', async (req, res) => {
  const userRole = req.headers['x-user-role'];
  const loggedInStudentId = req.headers['x-student-id'];

  // If student role, enforce student_id must match logged in ID
  if (userRole === 'student' && req.params.student_id.toString() !== loggedInStudentId.toString()) {
    return res.status(403).json({ error: 'You can only view your own registrations' });
  }

  try {
    const result = await db.execute(
      `SELECT r.STUDENT_ID, r.SESSION_ID, 
              TO_CHAR(r.REGISTRATION_DATE, 'YYYY-MM-DD') AS REGISTRATION_DATE,
              es.PHASE, es.SHIFT, TO_CHAR(es.EXAM_DATE, 'YYYY-MM-DD') AS EXAM_DATE,
              e.EXAM_NAME, e.EXAM_CODE,
              s.FIRST_NAME, s.LAST_NAME
       FROM REGISTRATION r
       JOIN EXAM_SESSION es ON r.SESSION_ID = es.SESSION_ID
       JOIN EXAM e ON es.EXAM_CODE = e.EXAM_CODE
       JOIN STUDENT s ON r.STUDENT_ID = s.STUDENT_ID
       WHERE r.STUDENT_ID = :id
       ORDER BY r.REGISTRATION_DATE DESC`,
      [req.params.student_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/registrations/:student_id/:session_id — Delete a registration (Admin only)
router.delete('/registrations/:student_id/:session_id', async (req, res) => {
  const userRole = req.headers['x-user-role'];
  if (userRole !== 'admin') {
    return res.status(403).json({ error: 'Only admins can delete registrations' });
  }

  try {
    await db.execute(
      'DELETE FROM REGISTRATION WHERE STUDENT_ID = :sid AND SESSION_ID = :ssid',
      { sid: req.params.student_id, ssid: req.params.session_id }
    );
    res.json({ message: 'Registration deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
