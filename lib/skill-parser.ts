import matter from 'gray-matter';
import path from 'path';

export interface SkillMetadata {
  name: string;
  description: string;
  [key: string]: any;
}

export interface SkillFile {
  filePath: string;
  fileName: string;
  fileContent: string;
  fileType: 'markdown' | 'script' | 'resource' | 'template';
  isExecutable: boolean;
  fileSize: number;
}

export interface ParsedSkill {
  metadata: SkillMetadata;
  instructions: string;
  files: SkillFile[];
  fileStructure: Record<string, any>;
  triggerKeywords: string[];
}

export class SkillParser {
  /**
   * Parse SKILL.md content and extract metadata + instructions
   */
  static parseSkillMarkdown(content: string): { metadata: SkillMetadata; instructions: string } {
    const parsed = matter(content);
    
    if (!parsed.data.name || !parsed.data.description) {
      throw new Error('SKILL.md must contain name and description in YAML frontmatter');
    }

    // Validate name format
    if (!/^[a-z0-9-]+$/.test(parsed.data.name)) {
      throw new Error('Skill name must contain only lowercase letters, numbers, and hyphens');
    }

    if (parsed.data.name.length > 64) {
      throw new Error('Skill name must be 64 characters or less');
    }

    // Check for reserved words
    const reservedWords = ['anthropic', 'claude'];
    if (reservedWords.some(word => parsed.data.name.includes(word))) {
      throw new Error(`Skill name cannot contain reserved words: ${reservedWords.join(', ')}`);
    }

    if (parsed.data.description.length > 1024) {
      throw new Error('Skill description must be 1024 characters or less');
    }

    return {
      metadata: parsed.data as SkillMetadata,
      instructions: parsed.content.trim()
    };
  }

  /**
   * Determine file type based on extension and content
   */
  static determineFileType(filePath: string, content: string): SkillFile['fileType'] {
    const ext = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath).toLowerCase();

    // Markdown files
    if (ext === '.md') {
      return 'markdown';
    }

    // Script files
    const scriptExtensions = ['.py', '.js', '.ts', '.sh', '.bat', '.ps1', '.rb', '.go', '.java'];
    if (scriptExtensions.includes(ext)) {
      return 'script';
    }

    // Template/config files
    const templateExtensions = ['.json', '.yaml', '.yml', '.xml', '.toml', '.ini', '.env'];
    const templateFiles = ['dockerfile', 'makefile', 'requirements.txt', 'package.json', 'composer.json'];
    
    if (templateExtensions.includes(ext) || templateFiles.includes(fileName)) {
      return 'template';
    }

    // Everything else is a resource
    return 'resource';
  }

  /**
   * Check if a file is executable based on extension
   */
  static isExecutable(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    const executableExtensions = ['.py', '.js', '.ts', '.sh', '.bat', '.ps1', '.rb', '.go'];
    return executableExtensions.includes(ext);
  }

  /**
   * Extract trigger keywords from description for search indexing
   */
  static extractTriggerKeywords(description: string): string[] {
    // Extract meaningful words from description
    const keywords = description
      .toLowerCase()
      // Remove common stop words
      .replace(/\b(the|a|an|and|or|but|in|on|at|to|for|of|with|by|use|when|this|that|these|those|is|are|was|were|be|been|have|has|had|do|does|did|will|would|could|should|may|might)\b/g, ' ')
      // Extract words that are 3+ characters
      .match(/\b[a-z]{3,}\b/g) || [];

    // Remove duplicates and return
    return [...new Set(keywords)];
  }

  /**
   * Build file structure mapping for JSON storage
   */
  static buildFileStructure(files: SkillFile[]): Record<string, any> {
    const structure: Record<string, any> = {};

    for (const file of files) {
      const parts = file.filePath.split('/');
      let current = structure;

      // Build nested structure
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }

      // Add file info
      const fileName = parts[parts.length - 1];
      current[fileName] = {
        type: file.fileType,
        executable: file.isExecutable,
        size: file.fileSize
      };
    }

    return structure;
  }

  /**
   * Build visual file tree for display
   */
  static buildFileTree(files: SkillFile[]): string[] {
    // Group files by directory
    const tree = new Map<string, string[]>();
    
    files.forEach(file => {
      const parts = file.filePath.split('/');
      const dirPath = parts.slice(0, -1).join('/') || '.';
      const fileName = parts[parts.length - 1];
      
      if (!tree.has(dirPath)) {
        tree.set(dirPath, []);
      }
      tree.get(dirPath)!.push(fileName);
    });

    // Build tree structure as array of strings
    const result: string[] = [];
    const sortedDirs = Array.from(tree.keys()).sort();
    
    sortedDirs.forEach((dir, index) => {
      if (dir === '.') {
        // Root files
        tree.get(dir)!.sort().forEach((file, fileIndex) => {
          const isLast = fileIndex === tree.get(dir)!.length - 1 && index === sortedDirs.length - 1;
          result.push(`${isLast ? '└── ' : '├── '}${file}`);
        });
      } else {
        // Directory
        const isLastDir = index === sortedDirs.length - 1;
        result.push(`${isLastDir ? '└── ' : '├── '}${dir}/`);
        
        // Files in directory
        tree.get(dir)!.sort().forEach((file, fileIndex) => {
          const isLastFile = fileIndex === tree.get(dir)!.length - 1;
          const prefix = isLastDir ? '    ' : '│   ';
          result.push(`${prefix}${isLastFile ? '└── ' : '├── '}${file}`);
        });
      }
    });

    return result;
  }

  /**
   * Validate skill structure and files
   */
  static validateSkillStructure(files: SkillFile[]): void {
    // Must have SKILL.md
    const hasSkillMd = files.some(f => f.fileName.toLowerCase() === 'skill.md');
    if (!hasSkillMd) {
      throw new Error('Skill must contain a SKILL.md file');
    }

    // Check for suspicious files
    const suspiciousPatterns = [
      /\.exe$/i,
      /\.dll$/i,
      /\.so$/i,
      /\.dylib$/i,
      /password/i,
      /secret/i,
      /api[_-]?key/i
    ];

    for (const file of files) {
      if (suspiciousPatterns.some(pattern => pattern.test(file.filePath))) {
        console.warn(`Potentially suspicious file detected: ${file.filePath}`);
      }
    }
  }

  /**
   * Parse a complete skill from GitHub repository analysis
   */
  static parseSkill(skillMdContent: string, allFiles: SkillFile[]): ParsedSkill {
    // Parse the main SKILL.md
    const { metadata, instructions } = this.parseSkillMarkdown(skillMdContent);

    // Validate overall structure
    this.validateSkillStructure(allFiles);

    // Process all files
    const processedFiles = allFiles.map(file => ({
      ...file,
      fileType: this.determineFileType(file.filePath, file.fileContent),
      isExecutable: this.isExecutable(file.filePath),
      fileSize: Buffer.byteLength(file.fileContent, 'utf8')
    }));

    // Build file structure
    const fileStructure = this.buildFileStructure(processedFiles);

    // Build file tree for display
    const fileTree = this.buildFileTree(processedFiles);

    // Extract trigger keywords
    const triggerKeywords = this.extractTriggerKeywords(metadata.description);

    return {
      metadata,
      instructions,
      files: processedFiles,
      fileStructure,
      fileTree,
      triggerKeywords
    };
  }
}

export default SkillParser;