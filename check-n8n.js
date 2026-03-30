const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('C:\\Users\\yashw\\.n8n\\database.sqlite');

db.all(`SELECT id, workflowId, status, data FROM execution_entity ORDER BY startedAt DESC LIMIT 2`, [], (err, rows) => {
  if (err) {
    throw err;
  }
  rows.forEach((row) => {
    console.log(`Execution ID: ${row.id}, Status: ${row.status}`);
    const data = JSON.parse(row.data);
    if (data.resultData && data.resultData.error) {
      console.log('Error:', data.resultData.error.message);
    }
    else {
      console.log(data); // print full layout
    }
  });
});
db.close();
