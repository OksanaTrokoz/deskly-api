'use strict';

const app = require('./app');
const logger = require('./logger');
const { API_KEY } = require('./middleware/auth');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  const p = logger.paint;

  const lines = [
    '',
    p('  ┌─────────────────────────────────────────────┐', 'cyan'),
    p('  │', 'cyan') + p('   Deskly API', 'bold', 'cyan') +
      p('  ·  hot-desk booking service   ', 'gray') + p('│', 'cyan'),
    p('  └─────────────────────────────────────────────┘', 'cyan'),
    '',
    `  ${p('▸', 'green')} ${p('Listening', 'bold')}  ${p(url, 'cyan')}`,
    `  ${p('▸', 'green')} ${p('API key', 'bold')}    ${p(API_KEY, 'yellow')}`,
    '',
    p(`  Try: curl -H "X-API-Key: ${API_KEY}" ${url}/desks`, 'gray'),
    '',
  ];

  console.log(lines.join('\n'));
  logger.success(`Deskly is ready on port ${PORT}`);
});
