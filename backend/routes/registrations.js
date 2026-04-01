const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/register — Register student for exam session
router.post('/register', async (req, res) => {
  const { student_id, session_id } = req.body;

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

// GET /api/registrations/:student_id — Get registrations for a student
router.get('/registrations/:student_id', async (req, res) => {
  try {
    const result = await db.execute(
      `SELECT r.STUDENT_ID, r.SESSION_ID, 
              TO_CHAR(r.REGISTRATION_DATE, 'YYYY-MM-DD') AS REGISTRATION_DATE,
              es.PHASE, es.SHIFT, TO_CHAR(es.EXAM_DATE, 'YYYY-MM-DD') AS EXAM_DATE,
              e.EXAM_NAME, e.EXAM_CODE
       FROM REGISTRATION r
       JOIN EXAM_SESSION es ON r.SESSION_ID = es.SESSION_ID
       JOIN EXAM e ON es.EXAM_CODE = e.EXAM_CODE
       WHERE r.STUDENT_ID = :id
       ORDER BY r.REGISTRATION_DATE DESC`,
      [req.params.student_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
