const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ ok: true });
});

app.listen(3009, () => {
  console.log('Test server running on port 3009');
});
