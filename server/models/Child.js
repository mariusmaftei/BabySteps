import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./Auth.js";

const Child = sequelize.define(
  "Child",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    age: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    gender: {
      type: DataTypes.ENUM("male", "female", "other"),
      allowNull: false,
      defaultValue: "other",
    },
    imageSrc: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    weight: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Weight in grams",
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Height in millimeters",
    },
    headCircumference: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Head circumference in millimeters",
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
  },
  {
    timestamps: true, // This will add createdAt and updatedAt fields
  }
);

// Remove the associations from here as they're defined in setupAssociations.js
// Child.belongsTo(User, { foreignKey: "userId", as: "parent" })
// User.hasMany(Child, { foreignKey: "userId", as: "children" })

export default Child;
