const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/allotments/:student_id — View seat allotment results
router.get('/allotments/:student_id', async (req, res) => {
  const userRole = req.headers['x-user-role'];
  const loggedInStudentId = req.headers['x-student-id'];

  if (userRole === 'student' && req.params.student_id.toString() !== loggedInStudentId.toString()) {
    return res.status(403).json({ error: 'You can only view your own allotments' });
  }

  try {
    const result = await db.execute(
      `SELECT a.STUDENT_ID, a.ROUND_NO, a.ALLOCATED_CATEGORY, a.STATUS,
              c.COLLEGE_ID, c.COLLEGE_NAME, c.COLLEGE_CITY,
              b.BRANCH_CODE, b.BRANCH_NAME,
              s.FIRST_NAME, s.LAST_NAME
       FROM ALLOTMENT a
       JOIN STUDENT s ON a.STUDENT_ID = s.STUDENT_ID
       LEFT JOIN COLLEGE c ON a.COLLEGE_ID = c.COLLEGE_ID
       LEFT JOIN BRANCH b ON a.BRANCH_CODE = b.BRANCH_CODE
       WHERE a.STUDENT_ID = :id
       ORDER BY a.ROUND_NO`,
      [req.params.student_id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/allotments — Update or Insert allotment (Admin only)
router.post('/allotments', async (req, res) => {
  const userRole = req.headers['x-user-role'];
  if (userRole !== 'admin') {
    return res.status(403).json({ error: 'Only admins can update allotments' });
  }

  const { student_id, round_no, college_id, branch_code, allocated_category, status } = req.body;

  if (!student_id || !round_no || !college_id || !branch_code) {
    return res.status(400).json({ error: 'Missing required allotment fields' });
  }

  try {
    const check = await db.execute(
      'SELECT * FROM ALLOTMENT WHERE STUDENT_ID = :sid AND ROUND_NO = :rnd',
      [student_id, round_no]
    );

    if (check.rows.length > 0) {
      await db.execute(
        `UPDATE ALLOTMENT SET 
          COLLEGE_ID = :college_id, BRANCH_CODE = :branch_code, 
          ALLOCATED_CATEGORY = :allocated_category, STATUS = :status
         WHERE STUDENT_ID = :sid AND ROUND_NO = :round_no`,
        { college_id, branch_code, allocated_category, status, sid: student_id, round_no }
      );
    } else {
      await db.execute(
        `INSERT INTO ALLOTMENT (STUDENT_ID, ROUND_NO, COLLEGE_ID, BRANCH_CODE, ALLOCATED_CATEGORY, STATUS)
         VALUES (:sid, :round_no, :college_id, :branch_code, :allocated_category, :status)`,
        { sid: student_id, round_no, college_id, branch_code, allocated_category, status }
      );
    }

    res.json({ message: 'Allotment updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
