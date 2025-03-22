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
      references: {
        model: "Children",
        key: "id",
      },
    },
    weight: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: "Weight in kilograms (kg)",
    },
    height: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: "Height in centimeters (cm)",
    },
    headCircumference: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: "Head circumference in centimeters (cm)",
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
      comment:
        "Indicates if this is the initial record created when the child was added",
    },
  },
  {
    timestamps: true,
    tableName: "growth_records",
  }
);

export default Growth;
