import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Child from "./Child.js";

const Diaper = sequelize.define(
  "Diaper",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    childId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Child,
        key: "id",
      },
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    type: {
      type: DataTypes.ENUM("wet", "dirty", "both"),
      allowNull: false,
    },
    color: {
      type: DataTypes.ENUM("yellow", "green", "brown", "black"),
      allowNull: true,
      defaultValue: null,
    },
    consistency: {
      type: DataTypes.ENUM("soft", "firm", "watery"),
      allowNull: true,
      defaultValue: null,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

export default Diaper;
