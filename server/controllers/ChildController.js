import Child from "../models/Child.js";

// Get all children for a user
export const getUserChildren = async (req, res) => {
  try {
    const userId = req.user.id; // Get user ID from auth middleware

    const children = await Child.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]], // Newest first
    });

    res.status(200).json(children);
  } catch (error) {
    console.error("Error fetching children:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get a specific child by ID
export const getChildById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const child = await Child.findOne({
      where: {
        id,
        userId, // Ensure the child belongs to the authenticated user
      },
    });

    if (!child) {
      return res.status(404).json({ message: "Child not found" });
    }

    res.status(200).json(child);
  } catch (error) {
    console.error("Error fetching child:", error);
    res.status(500).json({ error: error.message });
  }
};

// Create a new child
export const createChild = async (req, res) => {
  try {
    const {
      name,
      age,
      birthDate,
      gender,
      imageSrc,
      weight,
      height,
      headCircumference,
    } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    // Parse birth date if provided
    let parsedBirthDate = null;
    if (birthDate) {
      // Check if birthDate is in DD/MM/YYYY format
      const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
      const match = birthDate.match(dateRegex);

      if (match) {
        // Convert from DD/MM/YYYY to YYYY-MM-DD for proper Date parsing
        const [, day, month, year] = match;
        parsedBirthDate = new Date(`${year}-${month}-${day}`);
      } else {
        // Try to parse as a regular date string
        parsedBirthDate = new Date(birthDate);
      }

      // Validate the parsed date
      if (isNaN(parsedBirthDate.getTime())) {
        return res.status(400).json({ message: "Invalid birth date format" });
      }
    }

    // Calculate age string if birth date is provided
    let ageString = age || "Not specified";
    if (parsedBirthDate) {
      const now = new Date();
      const diffMonths =
        (now.getFullYear() - parsedBirthDate.getFullYear()) * 12 +
        (now.getMonth() - parsedBirthDate.getMonth());

      if (diffMonths < 1) {
        ageString = "Less than 1 month";
      } else if (diffMonths < 12) {
        ageString = `${diffMonths} month${diffMonths > 1 ? "s" : ""}`;
      } else {
        const years = Math.floor(diffMonths / 12);
        ageString = `${years} year${years > 1 ? "s" : ""}`;
      }
    }

    const newChild = await Child.create({
      name,
      age: ageString,
      birthDate: parsedBirthDate,
      gender: gender || "other",
      imageSrc,
      weight: weight || null,
      height: height || null,
      headCircumference: headCircumference || null,
      userId,
    });

    res.status(201).json(newChild);
  } catch (error) {
    console.error("Error creating child:", error);
    res.status(400).json({ error: error.message });
  }
};

// Update a child
export const updateChild = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      age,
      birthDate,
      gender,
      imageSrc,
      weight,
      height,
      headCircumference,
    } = req.body;
    const userId = req.user.id;

    const child = await Child.findOne({
      where: {
        id,
        userId, // Ensure the child belongs to the authenticated user
      },
    });

    if (!child) {
      return res.status(404).json({ message: "Child not found" });
    }

    // Parse birth date if provided
    let parsedBirthDate = null;
    if (birthDate) {
      // Check if birthDate is in DD/MM/YYYY format
      const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
      const match = birthDate.match(dateRegex);

      if (match) {
        // Convert from DD/MM/YYYY to YYYY-MM-DD for proper Date parsing
        const [, day, month, year] = match;
        parsedBirthDate = new Date(`${year}-${month}-${day}`);
      } else {
        // Try to parse as a regular date string
        parsedBirthDate = new Date(birthDate);
      }

      // Validate the parsed date
      if (isNaN(parsedBirthDate.getTime())) {
        return res.status(400).json({ message: "Invalid birth date format" });
      }
    }

    // Calculate age string if birth date is provided
    let ageString = age;
    if (parsedBirthDate) {
      const now = new Date();
      const diffMonths =
        (now.getFullYear() - parsedBirthDate.getFullYear()) * 12 +
        (now.getMonth() - parsedBirthDate.getMonth());

      if (diffMonths < 1) {
        ageString = "Less than 1 month";
      } else if (diffMonths < 12) {
        ageString = `${diffMonths} month${diffMonths > 1 ? "s" : ""}`;
      } else {
        const years = Math.floor(diffMonths / 12);
        ageString = `${years} year${years > 1 ? "s" : ""}`;
      }
    }

    // Update fields
    if (name) child.name = name;
    if (ageString) child.age = ageString;
    if (parsedBirthDate) child.birthDate = parsedBirthDate;
    if (gender) child.gender = gender;
    if (imageSrc !== undefined) child.imageSrc = imageSrc;
    if (weight !== undefined) child.weight = weight;
    if (height !== undefined) child.height = height;
    if (headCircumference !== undefined)
      child.headCircumference = headCircumference;

    await child.save();

    res.status(200).json(child);
  } catch (error) {
    console.error("Error updating child:", error);
    res.status(400).json({ error: error.message });
  }
};

// Delete a child
export const deleteChild = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const child = await Child.findOne({
      where: {
        id,
        userId, // Ensure the child belongs to the authenticated user
      },
    });

    if (!child) {
      return res.status(404).json({ message: "Child not found" });
    }

    await child.destroy();

    res.status(200).json({ message: "Child deleted successfully" });
  } catch (error) {
    console.error("Error deleting child:", error);
    res.status(500).json({ error: error.message });
  }
};
