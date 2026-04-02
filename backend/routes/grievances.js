const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/grievance — Submit a grievance
router.post('/grievance', async (req, res) => {
  const { student_id, issue_type, description } = req.body;
  const userRole = req.headers['x-user-role'];
  const loggedInStudentId = req.headers['x-student-id'];

  if (userRole === 'student' && student_id.toString() !== loggedInStudentId.toString()) {
    return res.status(403).json({ error: 'You can only submit grievances for yourself' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    // ... rest of the logic remains same for insertion
    const studentCheck = await connection.execute(
      'SELECT STUDENT_ID FROM STUDENT WHERE STUDENT_ID = :id',
      [student_id],
      { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
    );
    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const maxTicket = await connection.execute(
      'SELECT NVL(MAX(TICKET_NO), 0) + 1 AS NEXT_TICKET FROM GRIEVANCE',
      [],
      { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
    );
    const ticketNo = maxTicket.rows[0].NEXT_TICKET;

    await connection.execute(
      `INSERT INTO GRIEVANCE (STUDENT_ID, TICKET_NO, ISSUE_TYPE, DESCRIPTION, STATUS)
       VALUES (:student_id, :ticket_no, :issue_type, :description, 'Open')`,
      { student_id, ticket_no: ticketNo, issue_type, description }
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

// GET /api/grievances — List all grievances (Admin) or My grievances (Student)
router.get('/grievances', async (req, res) => {
  const userRole = req.headers['x-user-role'];
  const loggedInStudentId = req.headers['x-student-id'];

  try {
    let query = `
      SELECT g.STUDENT_ID, g.TICKET_NO, g.ISSUE_TYPE, g.DESCRIPTION, g.STATUS,
             s.FIRST_NAME, s.LAST_NAME
      FROM GRIEVANCE g
      JOIN STUDENT s ON g.STUDENT_ID = s.STUDENT_ID
    `;
    let params = [];

    if (userRole === 'student') {
      query += ' WHERE g.STUDENT_ID = :id';
      params.push(loggedInStudentId);
    }

    query += ' ORDER BY g.TICKET_NO DESC';
    const result = await db.execute(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/grievances/:student_id — Get grievances for a specific student
router.get('/grievances/:student_id', async (req, res) => {
  const userRole = req.headers['x-user-role'];
  const loggedInStudentId = req.headers['x-student-id'];
  const targetStudentId = req.params.student_id;

  if (userRole === 'student' && targetStudentId.toString() !== loggedInStudentId.toString()) {
    return res.status(403).json({ error: 'You can only view your own grievances' });
  }

  try {
    const result = await db.execute(
      `SELECT g.STUDENT_ID, g.TICKET_NO, g.ISSUE_TYPE, g.DESCRIPTION, g.STATUS,
              s.FIRST_NAME, s.LAST_NAME
       FROM GRIEVANCE g
       JOIN STUDENT s ON g.STUDENT_ID = s.STUDENT_ID
       WHERE g.STUDENT_ID = :id
       ORDER BY g.TICKET_NO DESC`,
      [targetStudentId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/grievance/:ticket_no — Update status (Admin only)
router.put('/grievance/:ticket_no', async (req, res) => {
  const userRole = req.headers['x-user-role'];
  if (userRole !== 'admin') {
    return res.status(403).json({ error: 'Only admins can update grievance status' });
  }

  const { status } = req.body;
  try {
    await db.execute(
      'UPDATE GRIEVANCE SET STATUS = :status WHERE TICKET_NO = :ticket_no',
      { status, ticket_no: req.params.ticket_no }
    );
    res.json({ message: 'Grievance status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
