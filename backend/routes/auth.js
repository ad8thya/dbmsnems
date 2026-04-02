const express = require('express');
const router = express.Router();
const db = require('../db');

// Hardcoded Admin credentials
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

// POST /api/login
router.post('/login', async (req, res) => {
  const { username, password, role } = req.body;

  try {
    if (role === 'admin') {
      if (username === ADMIN_USER && password === ADMIN_PASS) {
        return res.json({ success: true, role: 'admin', message: 'Admin logged in successfully' });
      } else {
        return res.status(401).json({ error: 'Invalid admin credentials' });
      }
    } else {
      // Student Login
      const result = await db.execute(
        'SELECT STUDENT_ID, FIRST_NAME, PASSWORD FROM STUDENT WHERE STUDENT_ID = :id',
        [username]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Student ID not found' });
      }

      const user = result.rows[0];
      if (user.PASSWORD === password) {
        return res.json({ 
          success: true, 
          role: 'student', 
          studentId: user.STUDENT_ID, 
          firstName: user.FIRST_NAME,
          message: 'Student logged in successfully' 
        });
      } else {
        return res.status(401).json({ error: 'Invalid password' });
      }
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/signup
router.post('/signup', async (req, res) => {
  const { first_name, last_name, email, dob, street, city, state, category, center_id, phone_numbers, password } = req.body;

  let connection;
  try {
    connection = await db.getConnection();

    // Get next student_id
    const seqResult = await connection.execute(
      'SELECT STUDENT_SEQ.NEXTVAL AS ID FROM DUAL',
      [], { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
    );
    const studentId = seqResult.rows[0].ID;

    // Insert student
    await connection.execute(
      `INSERT INTO STUDENT (STUDENT_ID, FIRST_NAME, LAST_NAME, EMAIL, DOB, STREET, CITY, STATE, CATEGORY, PASSWORD, CENTER_ID)
       VALUES (:id, :fname, :lname, :email, TO_DATE(:dob, 'YYYY-MM-DD'), :street, :city, :state, :category, :pass, :center_id)`,
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
        pass: password, // In production, we'd hash this
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
    res.status(201).json({ 
      success: true, 
      message: 'Student registered successfully!', 
      student_id: studentId 
    });
  } catch (err) {
    if (connection) await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

module.exports = router;
