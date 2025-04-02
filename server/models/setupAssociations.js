// Create a new file for setting up model associations
import User from "./Auth.js";
import Child from "./Child.js";
import Sleep from "./Sleep.js";
import Vaccination from "./Vaccination.js";
import Diaper from "./Diaper.js";
import Growth from "./Growth.js";
import Feeding from "./Feeding.js";

const setupAssociations = () => {
  // User has many Children
  User.hasMany(Child, {
    foreignKey: "userId",
    as: "children",
  });

  Child.belongsTo(User, {
    foreignKey: "userId",
    as: "user",
  });

  // Child has many Sleep records
  Child.hasMany(Sleep, {
    foreignKey: "childId",
    as: "sleepRecords",
  });

  Sleep.belongsTo(Child, {
    foreignKey: "childId",
    as: "child",
  });

  // Child has many Vaccination records
  Child.hasMany(Vaccination, {
    foreignKey: "childId",
    as: "vaccinations",
  });

  Vaccination.belongsTo(Child, {
    foreignKey: "childId",
    as: "child",
  });

  // Child has many Diaper records
  Child.hasMany(Diaper, {
    foreignKey: "childId",
    as: "diaperChanges",
  });

  Diaper.belongsTo(Child, {
    foreignKey: "childId",
    as: "child",
  });

  // Child has many Growth records
  Child.hasMany(Growth, {
    foreignKey: "childId",
    as: "growthRecords",
  });

  Growth.belongsTo(Child, {
    foreignKey: "childId",
    as: "child",
  });

  // Child has many Feeding records
  Child.hasMany(Feeding, {
    foreignKey: "childId",
    as: "feedingRecords",
  });

  Feeding.belongsTo(Child, {
    foreignKey: "childId",
    as: "child",
  });
};

export default setupAssociations;
