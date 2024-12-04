import fs from "fs";
import path from "path";

export interface FileInfo {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileInfo[];
}

export const readFilesFromDir = (dirPath: string): FileInfo[] => {
  const files = fs.readdirSync(dirPath);
  
  return files.map((file): FileInfo => {
    const fullPath = path.join(dirPath, file);
    const stats = fs.statSync(fullPath);
    
    if (stats.isDirectory()) {
      return {
        name: file,
        path: fullPath,
        isDirectory: true,
        children: readFilesFromDir(fullPath)
      };
    }
    
    return {
      name: file,
      path: fullPath,
      isDirectory: false
    };
  });
};
