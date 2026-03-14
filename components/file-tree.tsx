"use client";

import { ChevronRight, File, Folder } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export interface FileTreeFile {
  name: string;
  path: string;
  content?: string;
  type?: string;
  executable?: boolean;
  size?: number;
}

interface FileTreeItem {
  name: string;
  path: string;
  file?: FileTreeFile;
  items?: FileTreeItem[];
}

interface FileTreeProps {
  files: FileTreeFile[];
  selectedPath?: string;
  onFileSelect?: (file: FileTreeFile) => void;
  className?: string;
}

function buildTree(files: FileTreeFile[]): FileTreeItem[] {
  const root: Record<string, FileTreeItem> = {};

  // Sort files so directories group together predictably
  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));

  for (const file of sorted) {
    const parts = file.path.split("/");
    let currentMap = root;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const dirPath = parts.slice(0, i + 1).join("/");

      if (!currentMap[part]) {
        currentMap[part] = { name: part, path: dirPath, items: [] };
      }
      // Lazily initialise sub-map for the next level
      if (!currentMap[part]._childMap) {
        (currentMap[part] as FileTreeItem & { _childMap?: Record<string, FileTreeItem> })._childMap = {};
      }
      currentMap = (currentMap[part] as FileTreeItem & { _childMap?: Record<string, FileTreeItem> })._childMap!;
    }

    const fileName = parts[parts.length - 1];
    currentMap[fileName] = { name: fileName, path: file.path, file };
  }

  function toArray(map: Record<string, FileTreeItem>): FileTreeItem[] {
    const items = Object.values(map).map(node => {
      const childMap = (node as FileTreeItem & { _childMap?: Record<string, FileTreeItem> })._childMap;
      if (childMap) {
        return { name: node.name, path: node.path, items: toArray(childMap) };
      }
      return node;
    });

    // Directories first, then files — both alphabetically
    return items.sort((a, b) => {
      const aIsDir = !!a.items;
      const bIsDir = !!b.items;
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  return toArray(root);
}

function getFileColor(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "md") return "text-blue-400";
  if (["sh", "bash", "zsh"].includes(ext)) return "text-green-400";
  if (["ts", "tsx", "js", "jsx"].includes(ext)) return "text-yellow-400";
  if (ext === "json") return "text-pink-400";
  if (["py", "pyc"].includes(ext)) return "text-yellow-300";
  return "text-text-muted";
}

interface TreeNodeProps {
  item: FileTreeItem;
  selectedPath?: string;
  onFileSelect?: (file: FileTreeFile) => void;
  depth: number;
}

function TreeNode({ item, selectedPath, onFileSelect, depth }: TreeNodeProps) {
  const indent = depth * 12;

  if (item.items) {
    // Directory node
    return (
      <Collapsible defaultOpen>
        <CollapsibleTrigger asChild>
          <button
            className="group flex w-full items-center gap-1.5 py-1 pr-2 text-left font-mono text-xs font-bold uppercase tracking-widest text-text-muted hover:text-text-primary transition-colors"
            style={{ paddingLeft: `${8 + indent}px` }}
          >
            <ChevronRight
              className="h-3 w-3 shrink-0 transition-transform duration-150 group-data-[state=open]:rotate-90"
            />
            <Folder className="h-3 w-3 shrink-0 text-accent/70" />
            <span className="truncate">{item.name}</span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {item.items.map((child) => (
            <TreeNode
              key={child.path}
              item={child}
              selectedPath={selectedPath}
              onFileSelect={onFileSelect}
              depth={depth + 1}
            />
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  // File node
  const isSelected = selectedPath === item.path;
  const fileColor = getFileColor(item.name);

  return (
    <button
      onClick={() => item.file && onFileSelect?.(item.file)}
      className={`flex w-full items-center gap-1.5 py-1 pr-2 text-left font-mono text-xs font-bold uppercase tracking-widest transition-colors ${
        isSelected
          ? "bg-text-primary text-bg-base"
          : "text-text-muted hover:text-text-primary hover:bg-bg-card"
      }`}
      style={{ paddingLeft: `${8 + indent}px` }}
    >
      <File className={`h-3 w-3 shrink-0 ${isSelected ? "text-bg-base" : fileColor}`} />
      <span className="truncate">{item.name}</span>
    </button>
  );
}

export function FileTree({ files, selectedPath, onFileSelect, className }: FileTreeProps) {
  const tree = buildTree(files);

  if (files.length === 0) {
    return (
      <div className={`p-3 font-mono text-xs text-text-muted ${className ?? ""}`}>
        No files
      </div>
    );
  }

  return (
    <div className={`flex flex-col overflow-y-auto ${className ?? ""}`}>
      {tree.map((item) => (
        <TreeNode
          key={item.path}
          item={item}
          selectedPath={selectedPath}
          onFileSelect={onFileSelect}
          depth={0}
        />
      ))}
    </div>
  );
}
