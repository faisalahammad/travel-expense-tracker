import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_PATH = path.join(__dirname, "../public/ios-install-hint.png");

// Generate a simple iOS installation hint image
async function generateIOSHint() {
  try {
    console.log("Generating iOS installation hint image...");

    // Create a simple image with text
    const width = 600;
    const height = 400;

    const svgBuffer = Buffer.from(`
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f5f5f5"/>
        <rect x="50" y="50" width="500" height="80" rx="10" fill="#ffffff" stroke="#cccccc" stroke-width="2"/>
        <text x="75" y="95" font-family="Arial" font-size="24" fill="#333333">Share</text>
        <text x="180" y="95" font-family="Arial" font-size="24" fill="#333333">↑</text>

        <rect x="50" y="160" width="500" height="180" rx="10" fill="#ffffff" stroke="#cccccc" stroke-width="2"/>
        <text x="75" y="200" font-family="Arial" font-size="24" fill="#333333">Scroll down to find:</text>
        <rect x="75" y="220" width="450" height="50" rx="5" fill="#f9f9f9" stroke="#eeeeee" stroke-width="1"/>
        <text x="100" y="252" font-family="Arial" font-size="20" fill="#1976d2">Add to Home Screen</text>

        <text x="75" y="320" font-family="Arial" font-size="18" fill="#666666">Then tap "Add" in the top-right corner</text>
      </svg>
    `);

    await sharp(svgBuffer).png().toFile(TARGET_PATH);

    console.log(`Generated: ${TARGET_PATH}`);
  } catch (error) {
    console.error("Error generating iOS hint image:", error);
    process.exit(1);
  }
}

generateIOSHint();
