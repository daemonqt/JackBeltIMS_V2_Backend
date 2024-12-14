const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'fmpp5.h.filess.io',
    user: 'JackBeltIMS_swamistell',
    password: '05787a2b27a3668501a8cd51d0a1a160539a529d',
    database: 'JackBeltIMS_swamistell',
    port: '3305',
});

// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: '',
//     database: 'lascano_invmsystem',
// });

db.connect((err) => {

    if (err) {
        console.error('Error connecting to MySQL:', err);
    } else {
        console.log('Connected to MySQL');
    }
});

module.exports = db;