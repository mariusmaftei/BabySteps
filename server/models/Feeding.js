import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Child from "./Child.js";

const Feeding = sequelize.define(
  "Feeding",
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
    type: {
      type: DataTypes.ENUM("breast", "bottle", "solid"),
      allowNull: false,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: true, // Only required for breastfeeding
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true, // Only required for breastfeeding
    },
    duration: {
      type: DataTypes.INTEGER, // Duration in minutes
      allowNull: true, // Only required for breastfeeding
    },
    side: {
      type: DataTypes.ENUM("left", "right"),
      allowNull: true, // Only required for breastfeeding
    },
    amount: {
      type: DataTypes.INTEGER, // Amount in ml for bottle, grams for solid
      allowNull: true, // Only required for bottle and solid
    },
    note: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: true,
  }
);

export default Feeding;
