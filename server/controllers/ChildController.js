import Child from "../models/Child.js";

export const getUserChildren = async (req, res) => {
  try {
    const userId = req.user.id;

    const children = await Child.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json(children);
  } catch (error) {
    console.error("Error fetching children:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getChildById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const child = await Child.findOne({
      where: {
        id,
        userId,
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

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    let parsedBirthDate = null;
    if (birthDate) {
      const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
      const match = birthDate.match(dateRegex);

      if (match) {
        const [, day, month, year] = match;
        parsedBirthDate = new Date(`${year}-${month}-${day}`);
      } else {
        parsedBirthDate = new Date(birthDate);
      }

      if (isNaN(parsedBirthDate.getTime())) {
        return res.status(400).json({ message: "Invalid birth date format" });
      }
    }

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
        userId,
      },
    });

    if (!child) {
      return res.status(404).json({ message: "Child not found" });
    }

    let parsedBirthDate = null;
    if (birthDate) {
      const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
      const match = birthDate.match(dateRegex);

      if (match) {
        const [, day, month, year] = match;
        parsedBirthDate = new Date(`${year}-${month}-${day}`);
      } else {
        parsedBirthDate = new Date(birthDate);
      }

      if (isNaN(parsedBirthDate.getTime())) {
        return res.status(400).json({ message: "Invalid birth date format" });
      }
    }

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

export const deleteChild = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const child = await Child.findOne({
      where: {
        id,
        userId,
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
