const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'almoxarifado_escolar',
  password: 'shottz',
  port: 5432,
});

module.exports = pool;