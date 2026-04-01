const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/results/:student_id — Get all results for a student
router.get('/results/:student_id', async (req, res) => {
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

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No results found for this student' });
    }

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
