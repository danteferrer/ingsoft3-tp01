const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Marca = require('./Marca');

const Auto = sequelize.define('Auto', {
  modelo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  anio: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  patente: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  color: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  kilometraje: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

Marca.hasMany(Auto, { foreignKey: 'marcaId' });
Auto.belongsTo(Marca, { foreignKey: 'marcaId' });

module.exports = Auto;
