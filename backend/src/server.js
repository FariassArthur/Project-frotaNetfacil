const app = require('./app');
const { PORT } = require('./config');
const { initDb } = require('./database/schema');

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`GestaoFrota backend running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('DB init failed:', error);
    process.exit(1);
  });
