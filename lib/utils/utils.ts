import * as fs from "fs";
import * as path from "path";

export const readFilesFromFolder = (folderPath: string): string[] => {
  try {
    const fileNames = fs.readdirSync(path.join(__dirname, folderPath));
    return fileNames.map((fileName) => path.parse(fileName).name);
  } catch (err) {
    console.error("Error reading files:", err);
    throw new Error("Error reading files");
  }
};

export const capitalize = (s: string) => {
  if (typeof s !== "string") return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
};
