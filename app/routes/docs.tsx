import { json, LoaderFunction } from "@remix-run/node";
import { readFilesFromDir, FileInfo } from "../utils/fileReader";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import path from "path";
import { useState } from "react";
import { twMerge } from "tailwind-merge";

const start = "app/";
export const loader: LoaderFunction = async () => {
  const docsDir = path.join(process.cwd(), start + "snippets");
  const files = readFilesFromDir(docsDir);
  return json({ files });
};

const FileTree = ({ files }: { files: FileInfo[] }) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  return (
    <ul className="pl-4">
      {files.map((file) => (
        <li key={file.path} className="py-1">
          {file.isDirectory ? (
            <div>
              <button
                onClick={() => toggleFolder(file.path)}
                className="flex items-center gap-2 w-full text-left font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              >
                <span
                  className={twMerge(
                    "w-4 inline-block transition-transform",
                    expandedFolders.has(file.path) ? "rotate-90" : ""
                  )}
                >
                  ▶
                </span>
                {file.name}
              </button>
              {expandedFolders.has(file.path) && file.children && (
                <FileTree files={file.children} />
              )}
            </div>
          ) : (
            <Link
              to={file.path.replace(new RegExp(".*" + start + "snippets/"), "")}
              className="pl-6 block text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {file.name}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
};

const Docs = () => {
  const { files } = useLoaderData<{
    files: FileInfo[];
  }>();
  const [isNavOpen, setIsNavOpen] = useState(true);

  return (
    <div className="flex h-screen">
      {/* Navigation Sidebar */}
      <div className="h-screen overflow-visible relative pr-6">
        <button
          onClick={() => setIsNavOpen(!isNavOpen)}
          className="absolute right-[-1px] items-center flex top-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1 pb-2 z-10 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-none"
        >
          <span className="block w-4 h-4 mb-1">{isNavOpen ? "◀" : "▶"}</span>
        </button>
        <nav
          className={`${
            isNavOpen ? "w-64 p-4 opacity-100" : "w-0 opacity-0"
          } border-r border-gray-200 dark:border-gray-700  overflow-y-auto transition-[width] duration-300 ease-out relative h-full z-10`}
        >
          <h1 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">
            Useful snippets
          </h1>
          <FileTree files={files} />
        </nav>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Docs;
