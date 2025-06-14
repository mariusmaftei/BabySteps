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
      allowNull: true,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    side: {
      type: DataTypes.ENUM("left", "right"),
      allowNull: true,
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    note: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

export default Feeding;
