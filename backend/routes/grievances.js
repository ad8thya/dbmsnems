const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/grievance — Submit a grievance
router.post('/grievance', async (req, res) => {
  const { student_id, issue_type, description } = req.body;

  let connection;
  try {
    connection = await db.getConnection();

    // Check if student exists
    const studentCheck = await connection.execute(
      'SELECT STUDENT_ID FROM STUDENT WHERE STUDENT_ID = :id',
      [student_id],
      { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
    );
    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Auto-generate ticket_no: max existing + 1 in the entire table
    const maxTicket = await connection.execute(
      'SELECT NVL(MAX(TICKET_NO), 0) + 1 AS NEXT_TICKET FROM GRIEVANCE',
      [],
      { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
    );
    const ticketNo = maxTicket.rows[0].NEXT_TICKET;

    await connection.execute(
      `INSERT INTO GRIEVANCE (STUDENT_ID, TICKET_NO, ISSUE_TYPE, DESCRIPTION, STATUS)
       VALUES (:student_id, :ticket_no, :issue_type, :description, 'Open')`,
      {
        student_id,
        ticket_no: ticketNo,
        issue_type,
        description
      }
    );

    await connection.commit();
    res.status(201).json({ message: 'Grievance submitted successfully', ticket_no: ticketNo });
  } catch (err) {
    if (connection) await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// GET /api/grievances/:student_id — Get grievances for a student
router.get('/grievances/:student_id', async (req, res) => {
  try {
    const result = await db.execute(
      `SELECT g.STUDENT_ID, g.TICKET_NO, g.ISSUE_TYPE, g.DESCRIPTION, g.STATUS,
              s.FIRST_NAME, s.LAST_NAME
       FROM GRIEVANCE g
       JOIN STUDENT s ON g.STUDENT_ID = s.STUDENT_ID
       WHERE g.STUDENT_ID = :id
       ORDER BY g.TICKET_NO DESC`,
      [req.params.student_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
