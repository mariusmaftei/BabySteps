import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Vaccination = sequelize.define(
  "Vaccination",
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
    vaccineId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    vaccineName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dose: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    scheduledDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    ageMonths: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ageDays: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    isCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    completedDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completionNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "Vaccinations",
    timestamps: true,
  }
);

export default Vaccination;
