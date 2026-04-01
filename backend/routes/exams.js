const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/exams — List all exams
router.get('/', async (req, res) => {
  try {
    const result = await db.execute(
      'SELECT EXAM_CODE, EXAM_NAME, TOTAL_MARKS FROM EXAM ORDER BY EXAM_CODE'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/exams/:code/sessions — List sessions for an exam
router.get('/:code/sessions', async (req, res) => {
  try {
    const result = await db.execute(
      `SELECT SESSION_ID, EXAM_CODE, PHASE, SHIFT, 
              TO_CHAR(EXAM_DATE, 'YYYY-MM-DD') AS EXAM_DATE
       FROM EXAM_SESSION 
       WHERE EXAM_CODE = :code 
       ORDER BY EXAM_DATE, SHIFT`,
      [req.params.code]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
