// Windows native notifications for FinanceAI Pro
import notifier from 'node-notifier';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, title, message, data, action } = req.body;
  
  try {
    const result = await sendNotification(type, title, message, data, action);
    
    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Windows notification failed:', error);
    res.status(500).json({ error: error.message });
  }
}

async function sendNotification(type, title, message, data, action) {
  // Create notification object based on type
  const notification = createNotification(type, title, message, data);
  
  // Send notification
  const result = await new Promise((resolve, reject) => {
    notifier.notify(notification, (error, response, metadata) => {
      if (error) {
        reject(error);
      } else {
        resolve({
          response,
          metadata,
          timestamp: new Date().toISOString()
        });
      }
    });
  });
  
  // Log notification
  logNotification(type, title, message, result);
  
  // Handle actions if specified
  if (action) {
    await handleNotificationAction(action, data);
  }
  
  return result;
}

function createNotification(type, title, message, data) {
  const notification = {
    title: title || 'FinanceAI Pro',
    message: message || 'Processing completed',
    sound: true,
    timeout: 10,
    wait: true
  };
  
  // Set icon based on type
  switch (type) {
    case 'success':
      notification.icon = getIconPath('success.png');
      notification.sound = 'Notification.Default';
      break;
    case 'error':
      notification.icon = getIconPath('error.png');
      notification.sound = 'Notification.Hand';
      break;
    case 'warning':
      notification.icon = getIconPath('warning.png');
      notification.sound = 'Notification.Exclamation';
      break;
    case 'info':
      notification.icon = getIconPath('info.png');
      notification.sound = 'Notification.Asterisk';
      break;
    case 'pdf_complete':
      notification.icon = getIconPath('pdf.png');
      notification.title = 'PDF Processing Complete';
      notification.message = `${data?.filename || 'Document'} processed successfully`;
      break;
    case 'market_data':
      notification.icon = getIconPath('market.png');
      notification.title = 'Market Data Updated';
      notification.message = `${data?.symbolCount || 'Data'} symbols refreshed`;
      break;
    case 'bank_statement':
      notification.icon = getIconPath('bank.png');
      notification.title = 'Bank Statement Downloaded';
      notification.message = `${data?.count || 'Statement'} downloaded from ${data?.bank || 'bank'}`;
      break;
    case 'excel_export':
      notification.icon = getIconPath('excel.png');
      notification.title = 'Excel Export Ready';
      notification.message = `${data?.recordCount || 'Records'} exported to ${data?.filename || 'Excel'}`;
      break;
    default:
      notification.icon = getIconPath('default.png');
  }
  
  // Add actions for interactive notifications
  if (type === 'pdf_complete' && data?.filepath) {
    notification.actions = ['Open File', 'Open Folder'];
    notification.dropdownLabel = 'Actions';
  }
  
  return notification;
}

function getIconPath(iconName) {
  const iconPath = path.join(process.cwd(), 'assets', 'icons', iconName);
  
  // Create default icon if not exists
  if (!fs.existsSync(iconPath)) {
    createDefaultIcon(iconPath);
  }
  
  return iconPath;
}

function createDefaultIcon(iconPath) {
  // Ensure directory exists
  const dir = path.dirname(iconPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Create a simple default icon (base64 encoded PNG)
  const defaultIcon = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'base64'
  );
  
  fs.writeFileSync(iconPath, defaultIcon);
}

function logNotification(type, title, message, result) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type,
    title,
    message,
    response: result.response,
    metadata: result.metadata
  };
  
  const logPath = path.join(process.cwd(), 'logs', 'notifications.log');
  
  // Ensure log directory exists
  const dir = path.dirname(logPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
}

async function handleNotificationAction(action, data) {
  const { exec } = await import('child_process');
  
  switch (action) {
    case 'open_file':
      if (data?.filepath && fs.existsSync(data.filepath)) {
        exec(`start "" "${data.filepath}"`);
      }
      break;
    case 'open_folder':
      if (data?.filepath) {
        const folder = path.dirname(data.filepath);
        exec(`explorer "${folder}"`);
      }
      break;
    case 'open_url':
      if (data?.url) {
        exec(`start "" "${data.url}"`);
      }
      break;
  }
}

// Predefined notification templates
export const notificationTemplates = {
  pdfProcessingComplete: (filename, processingTime) => ({
    type: 'pdf_complete',
    title: 'PDF Processing Complete',
    message: `${filename} processed in ${processingTime}ms`,
    data: { filename, processingTime }
  }),
  
  marketDataUpdate: (symbolCount, source) => ({
    type: 'market_data',
    title: 'Market Data Updated',
    message: `${symbolCount} symbols updated from ${source}`,
    data: { symbolCount, source }
  }),
  
  bankStatementDownload: (count, bank) => ({
    type: 'bank_statement',
    title: 'Bank Statements Downloaded',
    message: `${count} statements downloaded from ${bank}`,
    data: { count, bank }
  }),
  
  excelExportComplete: (recordCount, filename) => ({
    type: 'excel_export',
    title: 'Excel Export Complete',
    message: `${recordCount} records exported to ${filename}`,
    data: { recordCount, filename }
  }),
  
  systemError: (error) => ({
    type: 'error',
    title: 'System Error',
    message: error.message || 'An error occurred',
    data: { error: error.toString() }
  }),
  
  systemWarning: (warning) => ({
    type: 'warning',
    title: 'System Warning',
    message: warning,
    data: { warning }
  }),
  
  taskComplete: (taskName, duration) => ({
    type: 'success',
    title: 'Task Complete',
    message: `${taskName} completed in ${duration}`,
    data: { taskName, duration }
  })
};

// Batch notification system
export class NotificationBatch {
  constructor() {
    this.notifications = [];
    this.delay = 1000; // 1 second between notifications
  }
  
  add(type, title, message, data, action) {
    this.notifications.push({ type, title, message, data, action });
  }
  
  async send() {
    const results = [];
    
    for (const notification of this.notifications) {
      try {
        const result = await sendNotification(
          notification.type,
          notification.title,
          notification.message,
          notification.data,
          notification.action
        );
        results.push(result);
        
        // Delay between notifications
        if (this.notifications.indexOf(notification) < this.notifications.length - 1) {
          await new Promise(resolve => setTimeout(resolve, this.delay));
        }
        
      } catch (error) {
        results.push({ error: error.message });
      }
    }
    
    this.notifications = []; // Clear batch
    return results;
  }
}

// Windows system integration
export async function createSystemNotification(title, message, type = 'info') {
  try {
    // Use Windows toast notifications for better integration
    const toastNotification = {
      title,
      message,
      icon: getIconPath(`${type}.png`),
      sound: true,
      timeout: 5,
      wait: false,
      type: 'info',
      actions: type === 'pdf_complete' ? ['Open', 'Dismiss'] : undefined
    };
    
    return new Promise((resolve, reject) => {
      notifier.notify(toastNotification, (error, response, metadata) => {
        if (error) {
          reject(error);
        } else {
          resolve({ response, metadata });
        }
      });
    });
    
  } catch (error) {
    console.error('System notification failed:', error);
    throw error;
  }
}

// Progress notification system
export class ProgressNotifier {
  constructor(title, total) {
    this.title = title;
    this.total = total;
    this.current = 0;
    this.startTime = Date.now();
  }
  
  update(increment = 1) {
    this.current += increment;
    const percentage = Math.round((this.current / this.total) * 100);
    const elapsed = Date.now() - this.startTime;
    const estimated = elapsed / this.current * this.total;
    const remaining = estimated - elapsed;
    
    const message = `${percentage}% complete (${this.current}/${this.total})`;
    
    notifier.notify({
      title: this.title,
      message: message,
      icon: getIconPath('progress.png'),
      sound: false,
      timeout: 2,
      wait: false
    });
  }
  
  complete() {
    const duration = Date.now() - this.startTime;
    
    notifier.notify({
      title: this.title,
      message: `Completed in ${Math.round(duration / 1000)}s`,
      icon: getIconPath('success.png'),
      sound: 'Notification.Default',
      timeout: 5,
      wait: false
    });
  }
}