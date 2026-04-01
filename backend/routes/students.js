const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/students — List all students with phone numbers
router.get('/', async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT s.STUDENT_ID, s.FIRST_NAME, s.LAST_NAME, s.EMAIL, 
             TO_CHAR(s.DOB, 'YYYY-MM-DD') AS DOB,
             s.STREET, s.CITY, s.STATE, s.CATEGORY, 
             s.CENTER_ID, c.CENTER_NAME, c.CENTER_CITY
      FROM STUDENT s
      LEFT JOIN CENTER c ON s.CENTER_ID = c.CENTER_ID
      ORDER BY s.STUDENT_ID
    `);

    // Fetch phone numbers for each student
    const students = [];
    for (const row of result.rows) {
      const phones = await db.execute(
        'SELECT PHONE_NUMBER FROM STUDENT_PHONE WHERE STUDENT_ID = :id',
        [row.STUDENT_ID]
      );
      students.push({
        ...row,
        PHONE_NUMBERS: phones.rows.map(p => p.PHONE_NUMBER)
      });
    }

    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/students/:id — Get single student
router.get('/:id', async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT s.STUDENT_ID, s.FIRST_NAME, s.LAST_NAME, s.EMAIL,
             TO_CHAR(s.DOB, 'YYYY-MM-DD') AS DOB,
             s.STREET, s.CITY, s.STATE, s.CATEGORY,
             s.CENTER_ID, c.CENTER_NAME
      FROM STUDENT s
      LEFT JOIN CENTER c ON s.CENTER_ID = c.CENTER_ID
      WHERE s.STUDENT_ID = :id
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const phones = await db.execute(
      'SELECT PHONE_NUMBER FROM STUDENT_PHONE WHERE STUDENT_ID = :id',
      [req.params.id]
    );

    res.json({
      ...result.rows[0],
      PHONE_NUMBERS: phones.rows.map(p => p.PHONE_NUMBER)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/students/centers/list — Get all centers for dropdown
router.get('/centers/list', async (req, res) => {
  try {
    const result = await db.execute(
      'SELECT CENTER_ID, CENTER_NAME, CENTER_CITY FROM CENTER ORDER BY CENTER_NAME'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/students — Create new student
router.post('/', async (req, res) => {
  const { first_name, last_name, email, dob, street, city, state, category, center_id, phone_numbers } = req.body;

  let connection;
  try {
    connection = await db.getConnection();

    // Get next student_id from sequence
    const seqResult = await connection.execute(
      'SELECT STUDENT_SEQ.NEXTVAL AS ID FROM DUAL',
      [], { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
    );
    const studentId = seqResult.rows[0].ID;

    // Insert student
    await connection.execute(
      `INSERT INTO STUDENT (STUDENT_ID, FIRST_NAME, LAST_NAME, EMAIL, DOB, STREET, CITY, STATE, CATEGORY, CENTER_ID)
       VALUES (:id, :fname, :lname, :email, TO_DATE(:dob, 'YYYY-MM-DD'), :street, :city, :state, :category, :center_id)`,
      {
        id: studentId,
        fname: first_name,
        lname: last_name,
        email: email,
        dob: dob,
        street: street,
        city: city,
        state: state,
        category: category,
        center_id: center_id
      }
    );

    // Insert phone numbers
    if (phone_numbers && phone_numbers.length > 0) {
      for (const phone of phone_numbers) {
        if (phone && phone.trim()) {
          await connection.execute(
            'INSERT INTO STUDENT_PHONE (STUDENT_ID, PHONE_NUMBER) VALUES (:id, :phone)',
            { id: studentId, phone: phone.trim() }
          );
        }
      }
    }

    await connection.commit();
    res.status(201).json({ message: 'Student registered successfully', student_id: studentId });
  } catch (err) {
    if (connection) await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// PUT /api/students/:id — Update student
router.put('/:id', async (req, res) => {
  const { first_name, last_name, email, dob, street, city, state, category, center_id } = req.body;

  try {
    const result = await db.execute(
      `UPDATE STUDENT SET 
        FIRST_NAME = :fname, LAST_NAME = :lname, EMAIL = :email,
        DOB = TO_DATE(:dob, 'YYYY-MM-DD'), STREET = :street, CITY = :city,
        STATE = :state, CATEGORY = :category, CENTER_ID = :center_id
       WHERE STUDENT_ID = :id`,
      {
        fname: first_name, lname: last_name, email: email,
        dob: dob, street: street, city: city,
        state: state, category: category, center_id: center_id,
        id: req.params.id
      }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json({ message: 'Student updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/students/:id — Delete student
router.delete('/:id', async (req, res) => {
  let connection;
  try {
    connection = await db.getConnection();
    
    // Delete phone numbers first
    await connection.execute(
      'DELETE FROM STUDENT_PHONE WHERE STUDENT_ID = :id',
      [req.params.id]
    );
    
    const result = await connection.execute(
      'DELETE FROM STUDENT WHERE STUDENT_ID = :id',
      [req.params.id]
    );

    await connection.commit();

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    if (connection) await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

module.exports = router;
