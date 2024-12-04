import { json, LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import fs from "fs";
import path from "path";

interface DocSection {
  type:
    | "description"
    | "example"
    | "param"
    | "returns"
    | "limitations"
    | "performance"
    | "remarks";
  title: string;
  content: string;
}

interface SnippetContent {
  docs: DocSection[];
  code: string;
}

function parseJSDoc(docString: string): DocSection[] {
  const sections: DocSection[] = [];
  const lines = docString.split("\n");

  let currentSection: DocSection | null = null;
  let buffer: string[] = [];
  let isInCodeBlock = false;

  function saveCurrentSection() {
    if (currentSection && buffer.length > 0) {
      // If this is an example section, wrap the content in a code block
      if (currentSection.type === "example") {
        const content = buffer.join("\n").trim();
        // Check if content is already wrapped in ```
        if (!content.startsWith("```")) {
          currentSection.content = "```tsx\n" + content + "\n```";
        } else {
          currentSection.content = content;
        }
      } else {
        currentSection.content = buffer.join("\n").trim();
      }
      sections.push(currentSection);
      buffer = [];
    }
  }

  for (const line of lines) {
    const trimmedLine = line.trim().replace(/^\*\s?/, "");

    // Skip empty lines and comment markers
    if (trimmedLine === "/**" || trimmedLine === "*/" || trimmedLine === "")
      continue;

    // Track code block status
    if (trimmedLine.startsWith("```")) {
      isInCodeBlock = !isInCodeBlock;
    }

    // Check for section markers (only if not in code block)
    if (trimmedLine.startsWith("@") && !isInCodeBlock) {
      saveCurrentSection();

      const tag = trimmedLine.split(" ")[0].substring(1);
      switch (tag) {
        case "example":
          currentSection = {
            type: "example",
            title: "Example Usage",
            content: "",
          };
          break;
        case "param":
          currentSection = { type: "param", title: "Parameters", content: "" };
          break;
        case "returns":
          currentSection = { type: "returns", title: "Returns", content: "" };
          break;
        case "limitations":
          currentSection = {
            type: "limitations",
            title: "Limitations",
            content: "",
          };
          break;
        case "performance":
          currentSection = {
            type: "performance",
            title: "Performance Considerations",
            content: "",
          };
          break;
        case "remarks":
          currentSection = {
            type: "remarks",
            title: "Additional Notes",
            content: "",
          };
          break;
        default:
          currentSection = {
            type: "description",
            title: "Description",
            content: "",
          };
      }
      buffer = [trimmedLine.substring(tag.length + 2)];
    } else {
      if (!currentSection) {
        currentSection = {
          type: "description",
          title: "Description",
          content: "",
        };
      }
      buffer.push(trimmedLine);
    }
  }

  saveCurrentSection();
  return sections;
}

function extractDocsAndCode(content: string): SnippetContent {
  const lines = content.split("\n");
  let docs = "";
  let code = "";
  let isInJSDoc = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith("/**")) {
      isInJSDoc = true;
      docs += line + "\n";
      continue;
    }

    if (isInJSDoc && line.trim().startsWith("*/")) {
      isInJSDoc = false;
      docs += line + "\n";
      continue;
    }

    if (isInJSDoc) {
      docs += line + "\n";
    } else {
      code += line + "\n";
    }
  }

  return { docs: parseJSDoc(docs), code };
}

export const loader: LoaderFunction = async ({ params }) => {
  const snippet = params["*"];
  if (!snippet) throw new Error("Snippet not found");

  const filePath = path.join(
    process.cwd(),
    "app/snippets",
    snippet.replace(/--/g, "/")
  );

  try {
    const rawContent = fs.readFileSync(filePath, "utf-8");
    const { docs, code } = extractDocsAndCode(rawContent);
    return json({ docs, code, fileName: path.basename(filePath) });
  } catch (error) {
    throw new Error("Snippet not found");
  }
};

const SnippetViewer = () => {
  const { docs, code, fileName } = useLoaderData<{
    docs: DocSection[];
    code: string;
    fileName: string;
  }>();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
        {fileName}
      </h2>

      {/* Documentation Sections */}
      {docs.length > 0 && (
        <div className="p-6 rounded-lg space-y-6">
          {docs.map((section, index) => (
            <div key={index} className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {section.title}
              </h3>
              <div className="prose dark:prose-invert max-w-none">
                {section.type === "example" ? (
                  <pre className="overflow-x-auto bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                    <code>{section.content}</code>
                  </pre>
                ) : (
                  <div
                    className={
                      "text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-normal"
                    }
                  >
                    {section.content}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Code Section */}
      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
          Implementation
        </h3>
        <pre className="overflow-x-auto">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

export default SnippetViewer;
