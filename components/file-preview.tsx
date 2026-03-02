"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface FilePreviewProps {
  files: any; // This will be JSON from Prisma
}

export default function FilePreview({ files }: FilePreviewProps) {
  // Parse the JSON files field
  const parsedFiles: Array<{ name: string; sizeKb: number; content: string }> = Array.isArray(files) ? files : [];
  const [selectedFile, setSelectedFile] = useState(parsedFiles[0]);

  if (!parsedFiles || parsedFiles.length === 0) {
    return (
      <div className="bg-bg-surface border border-border rounded-lg p-6">
        <p className="text-text-dim">No files available for preview.</p>
      </div>
    );
  }

  const isMarkdownFile = (filename: string) => {
    return filename.toLowerCase().endsWith('.md');
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'md':
        return '📝';
      case 'py':
        return '🐍';
      case 'js':
      case 'ts':
      case 'tsx':
      case 'jsx':
        return '📄';
      case 'yaml':
      case 'yml':
        return '⚙️';
      case 'json':
        return '📋';
      default:
        return '📄';
    }
  };

  const renderFileContent = (file: { name: string; content: string }) => {
    if (isMarkdownFile(file.name)) {
      return (
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {file.content}
          </ReactMarkdown>
        </div>
      );
    } else {
      return (
        <pre className="text-sm text-text-primary overflow-x-auto">
          <code>{file.content}</code>
        </pre>
      );
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-text-primary">Files</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* File List */}
        <div className="bg-bg-surface border border-border rounded-lg p-4">
          <h3 className="text-text-primary font-medium mb-4">Files ({parsedFiles.length})</h3>
          <div className="space-y-2">
            {parsedFiles.map((file) => (
              <button
                key={file.name}
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left p-3 rounded-sm transition-colors ${
                  selectedFile?.name === file.name
                    ? 'bg-accent/20 border border-accent/30'
                    : 'hover:bg-bg-card-hover'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{getFileIcon(file.name)}</span>
                    <span className="text-text-primary text-sm font-mono">
                      {file.name}
                    </span>
                  </div>
                  <span className="text-text-dim text-xs">
                    {file.sizeKb.toFixed(1)}KB
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* File Content */}
        <div className="md:col-span-2 bg-bg-surface border border-border rounded-lg">
          <div className="border-b border-border p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-text-primary font-mono text-sm">
                {selectedFile.name}
              </h3>
              <span className="text-text-dim text-xs">
                {selectedFile.sizeKb.toFixed(1)}KB
              </span>
            </div>
          </div>
          
          <div className="p-6 max-h-96 overflow-y-auto">
            {renderFileContent(selectedFile)}
          </div>
        </div>
      </div>
    </div>
  );
}