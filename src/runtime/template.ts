// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import os from 'node:os';
import path from 'node:path';
import fsAsync from 'node:fs/promises';
import log from '../utils/log.js';
import { Shell } from '../utils/shell.js';

const filepathsTemplate = async (cwd: string): Promise<Fig.TemplateSuggestion[]> => {
  const files = await fsAsync.readdir(cwd, { withFileTypes: true });
  return files.filter((f) => f.isFile() || f.isDirectory()).map((f) => ({
    name: f.name,
    priority: 90,
    context: { templateType: 'filepaths' },
  }));
};

const foldersTemplate = async (cwd: string): Promise<Fig.TemplateSuggestion[]> => {
  const files = await fsAsync.readdir(cwd, { withFileTypes: true });
  return files.filter((f) => f.isDirectory()).map((f) => ({
    name: f.name,
    priority: 90,
    context: { templateType: 'folders' },
  }));
};

// TODO: implement history template
const historyTemplate = async (shell: Shell): Promise<Fig.TemplateSuggestion[]> => {
  let fileName: string, formatFn: (history: string) => string[];
  switch (shell) {
    case Shell.Bash:
      fileName = '.bash_history';
      formatFn = h => h.split('\n');
      break;
    case Shell.Zsh:
      fileName = '.zsh_history';
      formatFn = h => h.split('\n').map(c => c.split(';').pop() as string);
      break;
    case Shell.Fish:
      fileName = '.fish_history';
      formatFn = (h) => {
        const lines = h.split('\n');
        const cmds = [];
        lines.forEach(line => {
          if (line.startsWith('- cmd: ')) {
            const cmd = line.slice('- cmd: '.length);
            cmds.push(cmd);
          }
        });
        return lines;
      };
      break;
    case Shell.Powershell:
    case Shell.Pwsh:
      fileName = 'AppData\\Roaming\\Microsoft\\Windows\\PowerShell\\PSReadline\\ConsoleHost_history.txt';
      formatFn = h => h.split('\n');
      break;
    default:
      return [];
  }
  const commands = formatFn(await fsAsync.readFile(path.join(os.homedir(), fileName), 'utf-8'));
  return commands.map((c) => ({ name: c, priority: 90, context: { templateType: 'history' } }));
};

// TODO: implement help template
const helpTemplate = (): Fig.TemplateSuggestion[] => {
  return [];
};

export const runTemplates = async (template: Fig.TemplateStrings[] | Fig.Template, cwd: string, shell: Shell): Promise<Fig.TemplateSuggestion[]> => {
  const templates = template instanceof Array ? template : [template];
  return (
    await Promise.all(
      templates.map(async (t) => {
        try {
          switch (t) {
            case 'filepaths':
              return await filepathsTemplate(cwd);
            case 'folders':
              return await foldersTemplate(cwd);
            case 'history':
              return await historyTemplate(shell);
            case 'help':
              return helpTemplate();
          }
        } catch (e) {
          log.debug({ msg: 'template failed', e, template: t, cwd });
          return [];
        }
      }),
    )
  ).flat();
};
