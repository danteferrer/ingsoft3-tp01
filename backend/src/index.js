require('dotenv').config();
const express = require('express');
const sequelize = require('./db');
const autosRouter = require('./routes/autos');
const marcasRouter = require('./routes/marcas');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/autos', autosRouter);
app.use('/api/marcas', marcasRouter);

const PORT = process.env.PORT || 8080;

sequelize
  .sync()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor escuchando en el puerto ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error al conectar con la base de datos:', error.message);
    process.exit(1);
  });

module.exports = app;
