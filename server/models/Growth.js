import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Growth = sequelize.define(
  "Growth",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    childId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    weight: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    height: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    headCircumference: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    weightProgress: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    heightProgress: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    headCircumferenceProgress: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    recordDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isInitialRecord: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "growth",
    timestamps: true,
  }
);

export default Growth;
