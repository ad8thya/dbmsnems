const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/results/:student_id — Get all results for a student
router.get('/results/:student_id', async (req, res) => {
  const userRole = req.headers['x-user-role'];
  const loggedInStudentId = req.headers['x-student-id'];

  if (userRole === 'student' && req.params.student_id.toString() !== loggedInStudentId.toString()) {
    return res.status(403).json({ error: 'You can only view your own results' });
  }

  try {
    const result = await db.execute(
      `SELECT r.STUDENT_ID, r.SESSION_ID, r.SCORE, r.PERCENTILE,
              es.PHASE, es.SHIFT, TO_CHAR(es.EXAM_DATE, 'YYYY-MM-DD') AS EXAM_DATE,
              e.EXAM_NAME, e.EXAM_CODE, e.TOTAL_MARKS,
              s.FIRST_NAME, s.LAST_NAME
       FROM RESULT r
       JOIN EXAM_SESSION es ON r.SESSION_ID = es.SESSION_ID
       JOIN EXAM e ON es.EXAM_CODE = e.EXAM_CODE
       JOIN STUDENT s ON r.STUDENT_ID = s.STUDENT_ID
       WHERE r.STUDENT_ID = :id
       ORDER BY es.EXAM_DATE DESC`,
      [req.params.student_id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/results — Update or Insert result (Admin only)
router.post('/results', async (req, res) => {
  const userRole = req.headers['x-user-role'];
  if (userRole !== 'admin') {
    return res.status(403).json({ error: 'Only admins can update results' });
  }

  const { student_id, session_id, score, percentile } = req.body;

  try {
    // Check if result exists
    const check = await db.execute(
      'SELECT * FROM RESULT WHERE STUDENT_ID = :sid AND SESSION_ID = :ssid',
      [student_id, session_id]
    );

    if (check.rows.length > 0) {
      // Update
      await db.execute(
        'UPDATE RESULT SET SCORE = :score, PERCENTILE = :percentile WHERE STUDENT_ID = :sid AND SESSION_ID = :ssid',
        { score, percentile, sid: student_id, ssid: session_id }
      );
    } else {
      // Insert
      await db.execute(
        'INSERT INTO RESULT (STUDENT_ID, SESSION_ID, SCORE, PERCENTILE) VALUES (:sid, :ssid, :score, :percentile)',
        { sid: student_id, ssid: session_id, score, percentile }
      );
    }

    res.json({ message: 'Result updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
