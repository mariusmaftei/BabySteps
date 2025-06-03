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
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "2025-01-01 00:00:00", // Default datetime string value
      comment:
        "Datetime string in YYYY-MM-DD HH:MM:SS format sent from client (Romania local time)",
      validate: {
        len: {
          args: [19, 19],
          msg: "Date must be exactly 19 characters (YYYY-MM-DD HH:MM:SS)",
        },
        is: {
          args: /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
          msg: "Date must be in YYYY-MM-DD HH:MM:SS format",
        },
      },
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
