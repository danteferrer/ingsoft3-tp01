const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Marca = sequelize.define('Marca', {
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
});

module.exports = Marca;
