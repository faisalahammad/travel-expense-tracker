import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_ICON = path.join(__dirname, "../public/favicon.png");
const TARGET_DIR = path.join(__dirname, "../public");

// Create the target directory if it doesn't exist
if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

// Define the icon sizes and filenames
const icons = [
  { size: 192, filename: "pwa-192x192.png" },
  { size: 512, filename: "pwa-512x512.png" },
  { size: 192, filename: "pwa-maskable-192x192.png", maskable: true },
  { size: 512, filename: "pwa-maskable-512x512.png", maskable: true },
  { size: 180, filename: "apple-touch-icon.png" },
];

// Generate each icon
async function generateIcons() {
  try {
    // Check if source icon exists
    if (!fs.existsSync(SOURCE_ICON)) {
      console.error(`Source icon not found: ${SOURCE_ICON}`);
      process.exit(1);
    }

    console.log(`Generating PWA icons from ${SOURCE_ICON}...`);

    for (const icon of icons) {
      const { size, filename, maskable } = icon;
      const targetPath = path.join(TARGET_DIR, filename);

      let sharpInstance = sharp(SOURCE_ICON).resize(size, size);

      // For maskable icons, add padding (10% on each side)
      if (maskable) {
        const padding = Math.floor(size * 0.1);
        const visibleSize = size - padding * 2;

        sharpInstance = sharp({
          create: {
            width: size,
            height: size,
            channels: 4,
            background: { r: 25, g: 118, b: 210, alpha: 1 }, // #1976d2 (primary color)
          },
        }).composite([
          {
            input: await sharp(SOURCE_ICON).resize(visibleSize, visibleSize).toBuffer(),
            gravity: "center",
          },
        ]);
      }

      await sharpInstance.toFile(targetPath);

      console.log(`Generated: ${targetPath}`);
    }

    console.log("All PWA icons generated successfully!");
  } catch (error) {
    console.error("Error generating icons:", error);
    process.exit(1);
  }
}

generateIcons();
