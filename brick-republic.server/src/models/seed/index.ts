import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "@models/user.js";
import Theme from "@models/theme.js";
import Minifigure from "@models/minifigure.js";
dotenv.config();

async function seedDatabase() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI!);
    console.log("Connected successfully. Clearing existing data...");

    await Promise.all([
      User.deleteMany({}),
      Theme.deleteMany({}),
      Minifigure.deleteMany({}),
    ]);

    console.log("Seeding Admin User...");
    const adminUser = new User({
      email: "admin@brickrepublic.com",
      password: "Coding@1234?",
      role: "admin",
      adminProfile: {
        department: "Head Management",
      },
      permissions: [
        "manage_orders",
        "manage_products",
        "manage_users",
        "view_reports",
      ],
    });
    await adminUser.save();

    console.log("Seeding Themes...");
    const starWarsTheme = new Theme({
      name: "Star Wars",
      slug: "star-wars",
      description:
        "Build your army with clones, Jedi, and Sith from across the galaxy.",
      visuals: {
        heroBanner: "/images/themes/star-wars-hero.jpg",
        icon: "/images/themes/star-wars-icon.png",
      },
    });
    await starWarsTheme.save();

    console.log("Seeding Minifigures...");
    const minifigures = [
      {
        name: "Phase-2 Commander Cody",
        theme: {
          themeId: starWarsTheme._id,
          slug: starWarsTheme.slug,
          name: starWarsTheme.name,
        },
        yearReleased: 2022,
        pricing: {
          retailPrice: mongoose.Types.Decimal128.fromString("35.00"),
        },
        stock: {
          newCondition: 12,
          usedCondition: 3,
        },
        accessories: ["Orange Visor", "Blaster Rifle"],
        tags: ["Clone Wars", "Galactic Republic", "Commander", "sw1125"],
      },
      {
        name: "Inquisitor Marrok",
        theme: {
          themeId: starWarsTheme._id,
          slug: starWarsTheme.slug,
          name: starWarsTheme.name,
        },
        yearReleased: 2023,
        pricing: {
          retailPrice: mongoose.Types.Decimal128.fromString("18.50"),
        },
        stock: {
          newCondition: 5,
          usedCondition: 0,
        },
        accessories: ["Double-bladed Lightsaber", "Armor"],
        tags: ["Ahsoka", "Empire", "Inquisitor"],
      },
    ];

    await Minifigure.insertMany(minifigures);

    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
