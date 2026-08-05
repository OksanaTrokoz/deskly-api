'use strict';

const app = require('./app');
const { API_KEY } = require('./middleware/auth');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Deskly listening on http://localhost:${PORT}`);
  console.log(`API key: ${API_KEY}`);
  console.log(`Try: curl -H "X-API-Key: ${API_KEY}" http://localhost:${PORT}/desks`);
});
