import { json, LoaderFunction } from '@remix-run/node';
import { readFilesFromDir } from '../utils/fileReader';
import { useLoaderData } from '@remix-run/react';
import path from 'path';

export const loader: LoaderFunction = async () => {
    const docsDir = path.join(process.cwd(), 'snippets');
    const files = readFilesFromDir(docsDir);
    return json({ files });
};

const Docs = () => {
    const { files } = useLoaderData<{ files: { name: string, path: string; }[]; }>();

    return (
        <div>
            <h1>Documentation Files</h1>
            <ul>
                {files.map(file => (
                    <li key={file.name}>
                        <a href={file.path}>{file.name}</a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Docs;
