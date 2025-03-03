import fs from "fs";
import path from "path";
import { AppState } from "../types";

// Define the data directory path
const DATA_DIR = path.join(process.cwd(), "data");
const APP_DATA_FILE = path.join(DATA_DIR, "app-state.json");

// Ensure the data directory exists
const ensureDataDirExists = (): void => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

// Save app state to JSON file
export const saveToFile = async (data: AppState): Promise<void> => {
  try {
    ensureDataDirExists();
    await fs.promises.writeFile(APP_DATA_FILE, JSON.stringify(data, null, 2));
    console.log("Data saved to file successfully");
  } catch (error) {
    console.error("Failed to save data to file", error);
  }
};

// Load app state from JSON file
export const loadFromFile = async <T>(defaultValue: T): Promise<T> => {
  try {
    ensureDataDirExists();

    if (!fs.existsSync(APP_DATA_FILE)) {
      return defaultValue;
    }

    const data = await fs.promises.readFile(APP_DATA_FILE, "utf8");
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error("Failed to load data from file", error);
    return defaultValue;
  }
};

// Save a specific tour to its own file
export const saveTourToFile = async (tourId: string, tourData: any): Promise<void> => {
  try {
    ensureDataDirExists();
    const tourFile = path.join(DATA_DIR, `tour-${tourId}.json`);
    await fs.promises.writeFile(tourFile, JSON.stringify(tourData, null, 2));
    console.log(`Tour ${tourId} saved to file successfully`);
  } catch (error) {
    console.error(`Failed to save tour ${tourId} to file`, error);
  }
};

// Load a specific tour from its file
export const loadTourFromFile = async (tourId: string): Promise<any | null> => {
  try {
    const tourFile = path.join(DATA_DIR, `tour-${tourId}.json`);

    if (!fs.existsSync(tourFile)) {
      return null;
    }

    const data = await fs.promises.readFile(tourFile, "utf8");
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Failed to load tour ${tourId} from file`, error);
    return null;
  }
};

// List all available tours from the data directory
export const listTourFiles = async (): Promise<string[]> => {
  try {
    ensureDataDirExists();
    const files = await fs.promises.readdir(DATA_DIR);
    return files.filter((file: string) => file.startsWith("tour-") && file.endsWith(".json")).map((file: string) => file.replace("tour-", "").replace(".json", ""));
  } catch (error) {
    console.error("Failed to list tour files", error);
    return [];
  }
};

// Delete a tour file
export const deleteTourFile = async (tourId: string): Promise<boolean> => {
  try {
    const tourFile = path.join(DATA_DIR, `tour-${tourId}.json`);

    if (!fs.existsSync(tourFile)) {
      return false;
    }

    await fs.promises.unlink(tourFile);
    console.log(`Tour ${tourId} deleted successfully`);
    return true;
  } catch (error) {
    console.error(`Failed to delete tour ${tourId}`, error);
    return false;
  }
};
