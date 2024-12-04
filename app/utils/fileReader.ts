import fs from 'fs';
import path from 'path';

export const readFilesFromDir = (dir: string) => {
    const files = fs.readdirSync(dir);
    return files.map(file => ({
        name: file,
        path: path.join(dir, file),
    }));
};
