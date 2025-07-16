// Windows Integration Hub for FinanceAI Pro
import { createSystemNotification, notificationTemplates } from './windows-notifications.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { operation, data } = req.body;
  
  try {
    let result;
    
    switch (operation) {
      case 'system_info':
        result = await getSystemInfo();
        break;
      case 'registry_check':
        result = await checkRegistry();
        break;
      case 'create_shortcut':
        result = await createDesktopShortcut(data);
        break;
      case 'file_association':
        result = await createFileAssociation(data);
        break;
      case 'startup_task':
        result = await createStartupTask(data);
        break;
      case 'context_menu':
        result = await addContextMenu(data);
        break;
      case 'system_tray':
        result = await createSystemTray(data);
        break;
      case 'windows_service':
        result = await createWindowsService(data);
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
    
    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Windows integration failed:', error);
    res.status(500).json({ error: error.message });
  }
}

// Get comprehensive system information
async function getSystemInfo() {
  try {
    const commands = [
      'systeminfo | findstr /B /C:"OS Name" /C:"OS Version" /C:"System Type" /C:"Total Physical Memory"',
      'wmic cpu get name,maxclockspeed,numberofcores /format:csv',
      'wmic logicaldisk get size,freespace,caption /format:csv'
    ];
    
    const results = await Promise.all(commands.map(cmd => execAsync(cmd)));
    
    const systemInfo = {
      os: parseSystemInfo(results[0].stdout),
      cpu: parseCPUInfo(results[1].stdout),
      drives: parseDriveInfo(results[2].stdout),
      nodeVersion: process.version,
      architecture: process.arch,
      platform: process.platform,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    };
    
    return { systemInfo };
    
  } catch (error) {
    return { error: error.message };
  }
}

// Check Windows registry for application settings
async function checkRegistry() {
  try {
    const regQueries = [
      'reg query "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v FinanceAI',
      'reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Classes\\.pdf\\OpenWithProgids"',
      'reg query "HKEY_CURRENT_USER\\Software\\Classes\\Applications\\FinanceAI.exe"'
    ];
    
    const results = {};
    
    for (const query of regQueries) {
      try {
        const result = await execAsync(query);
        results[query] = result.stdout;
      } catch (error) {
        results[query] = 'Not found';
      }
    }
    
    return { registryStatus: results };
    
  } catch (error) {
    return { error: error.message };
  }
}

// Create desktop shortcut
async function createDesktopShortcut(data) {
  try {
    const { name = 'FinanceAI Pro', target, icon, description } = data;
    
    const desktopPath = path.join(process.env.USERPROFILE, 'Desktop');
    const shortcutPath = path.join(desktopPath, `${name}.lnk`);
    
    // PowerShell script to create shortcut
    const psScript = `
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("${shortcutPath}")
$Shortcut.TargetPath = "${target || process.execPath}"
$Shortcut.WorkingDirectory = "${process.cwd()}"
$Shortcut.Description = "${description || 'FinanceAI Pro - Financial PDF Processing'}"
${icon ? `$Shortcut.IconLocation = "${icon}"` : ''}
$Shortcut.Save()
`;
    
    await execAsync(`powershell -Command "${psScript}"`);
    
    // Notify user
    await createSystemNotification('Shortcut Created', `${name} shortcut created on desktop`, 'success');
    
    return { shortcutPath, created: true };
    
  } catch (error) {
    return { error: error.message };
  }
}

// Create file association
async function createFileAssociation(data) {
  try {
    const { extension = '.pdf', appName = 'FinanceAI Pro', executable } = data;
    
    const regCommands = [
      `reg add "HKEY_CURRENT_USER\\Software\\Classes\\${extension}" /ve /d "${appName}.Document" /f`,
      `reg add "HKEY_CURRENT_USER\\Software\\Classes\\${appName}.Document" /ve /d "${appName} Document" /f`,
      `reg add "HKEY_CURRENT_USER\\Software\\Classes\\${appName}.Document\\shell\\open\\command" /ve /d "\\"${executable || process.execPath}\\" \\"%1\\"" /f`
    ];
    
    for (const cmd of regCommands) {
      await execAsync(cmd);
    }
    
    await createSystemNotification('File Association Created', `${extension} files now open with ${appName}`, 'success');
    
    return { association: `${extension} -> ${appName}`, created: true };
    
  } catch (error) {
    return { error: error.message };
  }
}

// Create startup task
async function createStartupTask(data) {
  try {
    const { name = 'FinanceAI Pro', executable, arguments: args = '' } = data;
    
    const regCommand = `reg add "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "${name}" /d "\\"${executable || process.execPath}\\" ${args}" /f`;
    
    await execAsync(regCommand);
    
    await createSystemNotification('Startup Task Created', `${name} will start with Windows`, 'success');
    
    return { startupTask: name, created: true };
    
  } catch (error) {
    return { error: error.message };
  }
}

// Add context menu entries
async function addContextMenu(data) {
  try {
    const { fileType = '*', menuText = 'Process with FinanceAI Pro', executable } = data;
    
    const regCommands = [
      `reg add "HKEY_CURRENT_USER\\Software\\Classes\\${fileType}\\shell\\FinanceAI" /ve /d "${menuText}" /f`,
      `reg add "HKEY_CURRENT_USER\\Software\\Classes\\${fileType}\\shell\\FinanceAI\\command" /ve /d "\\"${executable || process.execPath}\\" \\"%1\\"" /f`
    ];
    
    for (const cmd of regCommands) {
      await execAsync(cmd);
    }
    
    await createSystemNotification('Context Menu Added', `"${menuText}" added to right-click menu`, 'success');
    
    return { contextMenu: menuText, created: true };
    
  } catch (error) {
    return { error: error.message };
  }
}

// Create system tray application
async function createSystemTray(data) {
  try {
    const { title = 'FinanceAI Pro', icon, port = 3000 } = data;
    
    // Create system tray script
    const trayScript = `
const { app, BrowserWindow, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let tray = null;
let window = null;

app.whenReady().then(() => {
  // Create tray icon
  const icon = nativeImage.createFromPath('${icon || path.join(process.cwd(), 'assets', 'icon.png')}');
  tray = new Tray(icon);
  
  // Create context menu
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open FinanceAI Pro',
      click: () => {
        if (window) {
          window.show();
        } else {
          createWindow();
        }
      }
    },
    {
      label: 'Process PDF',
      click: () => {
        // Open file dialog or process last file
      }
    },
    { type: 'separator' },
    {
      label: 'Exit',
      click: () => {
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('${title}');
  tray.setContextMenu(contextMenu);
  
  // Handle clicks
  tray.on('click', () => {
    if (window) {
      window.isVisible() ? window.hide() : window.show();
    } else {
      createWindow();
    }
  });
});

function createWindow() {
  window = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  
  window.loadURL('http://localhost:${port}');
  window.show();
  
  window.on('closed', () => {
    window = null;
  });
}

app.on('window-all-closed', () => {
  // Keep app running in tray
});
`;
    
    const trayPath = path.join(process.cwd(), 'system-tray.js');
    fs.writeFileSync(trayPath, trayScript);
    
    return { trayScript: trayPath, created: true };
    
  } catch (error) {
    return { error: error.message };
  }
}

// Create Windows service
async function createWindowsService(data) {
  try {
    const { serviceName = 'FinanceAI Pro Service', executable, description } = data;
    
    // Create service using sc command
    const serviceCommands = [
      `sc create "${serviceName}" binPath= "${executable || process.execPath}" start= auto`,
      `sc description "${serviceName}" "${description || 'FinanceAI Pro Financial Processing Service'}"`
    ];
    
    for (const cmd of serviceCommands) {
      await execAsync(cmd);
    }
    
    await createSystemNotification('Windows Service Created', `${serviceName} service installed`, 'success');
    
    return { service: serviceName, created: true };
    
  } catch (error) {
    return { error: error.message };
  }
}

// Helper functions
function parseSystemInfo(output) {
  const lines = output.split('\n');
  const info = {};
  
  lines.forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      info[key.trim()] = valueParts.join(':').trim();
    }
  });
  
  return info;
}

function parseCPUInfo(output) {
  const lines = output.split('\n').filter(line => line.includes(','));
  const cpuInfo = [];
  
  lines.forEach(line => {
    const parts = line.split(',');
    if (parts.length >= 4) {
      cpuInfo.push({
        name: parts[1],
        maxClockSpeed: parts[2],
        cores: parts[3]
      });
    }
  });
  
  return cpuInfo;
}

function parseDriveInfo(output) {
  const lines = output.split('\n').filter(line => line.includes(','));
  const drives = [];
  
  lines.forEach(line => {
    const parts = line.split(',');
    if (parts.length >= 3) {
      drives.push({
        caption: parts[1],
        freeSpace: parts[2],
        size: parts[3]
      });
    }
  });
  
  return drives;
}

// Windows-specific utilities
export class WindowsUtils {
  static async openFileExplorer(path) {
    try {
      await execAsync(`explorer "${path}"`);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  static async openRegistryEditor(key) {
    try {
      await execAsync(`regedit /e ${key}`);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  static async openTaskManager() {
    try {
      await execAsync('taskmgr');
      return true;
    } catch (error) {
      return false;
    }
  }
  
  static async openEventViewer() {
    try {
      await execAsync('eventvwr');
      return true;
    } catch (error) {
      return false;
    }
  }
  
  static async openControlPanel() {
    try {
      await execAsync('control');
      return true;
    } catch (error) {
      return false;
    }
  }
  
  static async createScheduledTask(name, command, schedule) {
    try {
      const schtaskCommand = `schtasks /create /tn "${name}" /tr "${command}" /sc ${schedule}`;
      await execAsync(schtaskCommand);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  static async getInstalledPrograms() {
    try {
      const result = await execAsync('wmic product get name,version,vendor /format:csv');
      return result.stdout.split('\n').filter(line => line.includes(',')).map(line => {
        const parts = line.split(',');
        return {
          name: parts[1],
          vendor: parts[2],
          version: parts[3]
        };
      });
    } catch (error) {
      return [];
    }
  }
  
  static async getProcessList() {
    try {
      const result = await execAsync('tasklist /fo csv');
      return result.stdout.split('\n').filter(line => line.includes(',')).map(line => {
        const parts = line.split(',');
        return {
          name: parts[0].replace(/"/g, ''),
          pid: parts[1].replace(/"/g, ''),
          memory: parts[4].replace(/"/g, '')
        };
      });
    } catch (error) {
      return [];
    }
  }
}