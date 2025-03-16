// Create a new file for setting up model associations
import User from "./Auth.js";
import Child from "./Child.js";
import Sleep from "./Sleep.js";

const setupAssociations = () => {
  // Define the relationship between User and Child
  Child.belongsTo(User, { foreignKey: "userId", as: "user" });
  User.hasMany(Child, { foreignKey: "userId", as: "children" });

  // Define the relationship between Child and Sleep
  Sleep.belongsTo(Child, { foreignKey: "childId" });
  Child.hasMany(Sleep, { foreignKey: "childId", as: "sleepRecords" });

  // Add other model associations here as needed
};

export default setupAssociations;
