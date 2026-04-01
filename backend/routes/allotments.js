const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/allotments/:student_id — View seat allotment results
router.get('/allotments/:student_id', async (req, res) => {
  try {
    const result = await db.execute(
      `SELECT a.STUDENT_ID, a.ROUND_NO, a.ALLOCATED_CATEGORY, a.STATUS,
              c.COLLEGE_ID, c.COLLEGE_NAME, c.COLLEGE_CITY,
              b.BRANCH_CODE, b.BRANCH_NAME,
              s.FIRST_NAME, s.LAST_NAME
       FROM ALLOTMENT a
       JOIN COLLEGE c ON a.COLLEGE_ID = c.COLLEGE_ID
       JOIN BRANCH b ON a.BRANCH_CODE = b.BRANCH_CODE
       JOIN STUDENT s ON a.STUDENT_ID = s.STUDENT_ID
       WHERE a.STUDENT_ID = :id
       ORDER BY a.ROUND_NO`,
      [req.params.student_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No allotment records found for this student' });
    }

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
