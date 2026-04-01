const oracledb = require('oracledb');

// Oracle connection configuration
const dbConfig = {
  user: 'system',
  password: '1070',
  // Note: For older Oracle XE like 11g, the service name is usually 'xe'
  connectString: '127.0.0.1:1521/XEPDB1'
};

// Initialize connection pool
async function initialize() {
  try {
    await oracledb.createPool({
      ...dbConfig,
      poolMin: 2,
      poolMax: 10,
      poolAlias: 'default'
    });
    console.log('✅ Oracle connection pool created successfully');
  } catch (err) {
    console.error('❌ Failed to create Oracle pool:', err.message);
    throw err;
  }
}

// Get a connection from the pool
async function getConnection() {
  return await oracledb.getConnection('default');
}

// Run a query and return results as objects
async function execute(sql, binds = [], options = {}) {
  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true,
      ...options
    });
    return result;
  } catch (err) {
    console.error('Query error:', err.message);
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err.message);
      }
    }
  }
}

// Close the pool on shutdown
async function close() {
  try {
    await oracledb.getPool('default').close(10);
    console.log('Oracle connection pool closed');
  } catch (err) {
    console.error('Error closing pool:', err.message);
  }
}

module.exports = { initialize, getConnection, execute, close };
