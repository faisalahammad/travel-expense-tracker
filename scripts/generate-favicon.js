import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_ICON = path.join(__dirname, "../public/favicon.png");
const TARGET_PATH = path.join(__dirname, "../public/favicon.ico");

// Generate favicon.ico with multiple sizes
async function generateFavicon() {
  try {
    // Check if source icon exists
    if (!fs.existsSync(SOURCE_ICON)) {
      console.error(`Source icon not found: ${SOURCE_ICON}`);
      process.exit(1);
    }

    console.log(`Generating favicon.ico from ${SOURCE_ICON}...`);

    // Create a buffer for each size
    const buffer16 = await sharp(SOURCE_ICON).resize(16, 16).toBuffer();
    const buffer32 = await sharp(SOURCE_ICON).resize(32, 32).toBuffer();
    const buffer48 = await sharp(SOURCE_ICON).resize(48, 48).toBuffer();

    // Use the 32x32 version as favicon.ico
    // For a proper multi-size .ico file, you would need a specialized library
    fs.writeFileSync(TARGET_PATH, buffer32);

    console.log(`Generated: ${TARGET_PATH}`);
    console.log("Favicon generated successfully!");
  } catch (error) {
    console.error("Error generating favicon:", error);
    process.exit(1);
  }
}

generateFavicon();
