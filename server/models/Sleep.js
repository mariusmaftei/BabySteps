import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Child from "./Child.js";

const Sleep = sequelize.define(
  "Sleep",
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
    napHours: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 24,
      },
    },
    nightHours: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 24,
      },
    },
    totalHours: {
      type: DataTypes.VIRTUAL,
      get() {
        return (
          Number.parseFloat(this.napHours || 0) +
          Number.parseFloat(this.nightHours || 0)
        );
      },
      set(value) {
        throw new Error("Do not try to set the `totalHours` value!");
      },
    },
    sleepProgress: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment:
        "Percentage difference from recommended sleep hours (can be negative or positive)",
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    autoFilled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["childId", "date"],
      },
    ],
  }
);

export default Sleep;
