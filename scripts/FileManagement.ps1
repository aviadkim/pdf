# FinanceAI Pro - Windows PowerShell File Management Scripts
# Enhanced file operations with native Windows capabilities

param(
    [string]$Operation = "help",
    [string]$Path = "",
    [string]$Destination = "",
    [string]$Pattern = "*",
    [int]$Days = 30,
    [switch]$Force
)

# Import required modules
Import-Module Microsoft.PowerShell.Management
Import-Module Microsoft.PowerShell.Utility

# Configuration
$ConfigPath = Join-Path $PSScriptRoot "..\config\file-management.json"
$LogPath = Join-Path $PSScriptRoot "..\logs\file-management.log"

# Ensure directories exist
if (-not (Test-Path (Split-Path $LogPath))) {
    New-Item -Path (Split-Path $LogPath) -ItemType Directory -Force
}

# Logging function
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    Write-Host $logEntry
    Add-Content -Path $LogPath -Value $logEntry
}

# Load configuration
function Load-Config {
    if (Test-Path $ConfigPath) {
        return Get-Content $ConfigPath | ConvertFrom-Json
    } else {
        return @{
            DefaultPaths = @{
                Downloads = "C:\Users\$env:USERNAME\Downloads"
                Documents = "C:\Users\$env:USERNAME\Documents"
                Exports = ".\exports"
                Backups = ".\backups"
                Temp = ".\temp"
            }
            RetentionDays = 30
            MaxFileSize = 100MB
            AllowedExtensions = @(".pdf", ".xlsx", ".csv", ".json", ".txt")
        }
    }
}

# Save configuration
function Save-Config {
    param([object]$Config)
    $Config | ConvertTo-Json -Depth 3 | Set-Content $ConfigPath
}

# Main operations
function Invoke-FileOperation {
    param([string]$Op, [string]$SourcePath, [string]$DestPath, [string]$FilePattern, [int]$RetentionDays, [bool]$ForceOperation)
    
    $config = Load-Config
    
    switch ($Op.ToLower()) {
        "organize" { Invoke-OrganizeFiles -Path $SourcePath -Pattern $FilePattern -Config $config }
        "cleanup" { Invoke-CleanupFiles -Path $SourcePath -Days $RetentionDays -Force $ForceOperation }
        "backup" { Invoke-BackupFiles -Source $SourcePath -Destination $DestPath -Config $config }
        "compress" { Invoke-CompressFiles -Path $SourcePath -Destination $DestPath }
        "monitor" { Invoke-MonitorFolder -Path $SourcePath -Config $config }
        "security" { Invoke-SecurityScan -Path $SourcePath -Config $config }
        "report" { Invoke-GenerateReport -Path $SourcePath -Config $config }
        "schedule" { Invoke-ScheduleTask -Operation $SourcePath -Config $config }
        default { Show-Help }
    }
}

# Organize files by type and date
function Invoke-OrganizeFiles {
    param([string]$Path, [string]$Pattern, [object]$Config)
    
    Write-Log "Starting file organization in: $Path"
    
    if (-not (Test-Path $Path)) {
        Write-Log "Path does not exist: $Path" "ERROR"
        return
    }
    
    $files = Get-ChildItem -Path $Path -Filter $Pattern -File
    $organized = 0
    
    foreach ($file in $files) {
        try {
            $extension = $file.Extension.ToLower()
            $date = $file.CreationTime.ToString("yyyy-MM")
            
            # Determine target folder based on file type
            $targetFolder = switch ($extension) {
                ".pdf" { "PDFs" }
                ".xlsx" { "Excel" }
                ".csv" { "Data" }
                ".json" { "JSON" }
                ".txt" { "Text" }
                default { "Other" }
            }
            
            # Create organized structure
            $targetPath = Join-Path $Path "$targetFolder\$date"
            if (-not (Test-Path $targetPath)) {
                New-Item -Path $targetPath -ItemType Directory -Force | Out-Null
            }
            
            # Move file
            $newPath = Join-Path $targetPath $file.Name
            if (-not (Test-Path $newPath)) {
                Move-Item -Path $file.FullName -Destination $newPath
                Write-Log "Moved: $($file.Name) -> $targetPath"
                $organized++
            }
            
        } catch {
            Write-Log "Error organizing $($file.Name): $($_.Exception.Message)" "ERROR"
        }
    }
    
    Write-Log "Organization complete. Files organized: $organized"
}

# Cleanup old files
function Invoke-CleanupFiles {
    param([string]$Path, [int]$Days, [bool]$Force)
    
    Write-Log "Starting cleanup of files older than $Days days in: $Path"
    
    if (-not (Test-Path $Path)) {
        Write-Log "Path does not exist: $Path" "ERROR"
        return
    }
    
    $cutoffDate = (Get-Date).AddDays(-$Days)
    $files = Get-ChildItem -Path $Path -Recurse -File | Where-Object { $_.LastWriteTime -lt $cutoffDate }
    
    $cleaned = 0
    $totalSize = 0
    
    foreach ($file in $files) {
        try {
            $totalSize += $file.Length
            
            if ($Force -or (Read-Host "Delete $($file.Name)? (y/n)").ToLower() -eq 'y') {
                Remove-Item -Path $file.FullName -Force
                Write-Log "Deleted: $($file.FullName)"
                $cleaned++
            }
            
        } catch {
            Write-Log "Error deleting $($file.Name): $($_.Exception.Message)" "ERROR"
        }
    }
    
    Write-Log "Cleanup complete. Files deleted: $cleaned, Space freed: $([math]::Round($totalSize/1MB, 2)) MB"
}

# Backup files
function Invoke-BackupFiles {
    param([string]$Source, [string]$Destination, [object]$Config)
    
    Write-Log "Starting backup from $Source to $Destination"
    
    if (-not (Test-Path $Source)) {
        Write-Log "Source path does not exist: $Source" "ERROR"
        return
    }
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupPath = Join-Path $Destination "backup_$timestamp"
    
    try {
        # Create backup directory
        New-Item -Path $backupPath -ItemType Directory -Force | Out-Null
        
        # Copy files
        $files = Get-ChildItem -Path $Source -Recurse -File
        $backed = 0
        
        foreach ($file in $files) {
            $relativePath = $file.FullName.Replace($Source, "").TrimStart("\")
            $targetPath = Join-Path $backupPath $relativePath
            $targetDir = Split-Path $targetPath
            
            if (-not (Test-Path $targetDir)) {
                New-Item -Path $targetDir -ItemType Directory -Force | Out-Null
            }
            
            Copy-Item -Path $file.FullName -Destination $targetPath -Force
            $backed++
        }
        
        Write-Log "Backup complete. Files backed up: $backed to $backupPath"
        
    } catch {
        Write-Log "Backup failed: $($_.Exception.Message)" "ERROR"
    }
}

# Compress files
function Invoke-CompressFiles {
    param([string]$Path, [string]$Destination)
    
    Write-Log "Starting compression of: $Path"
    
    if (-not (Test-Path $Path)) {
        Write-Log "Path does not exist: $Path" "ERROR"
        return
    }
    
    try {
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $zipPath = Join-Path $Destination "archive_$timestamp.zip"
        
        # Ensure destination directory exists
        $destDir = Split-Path $zipPath
        if (-not (Test-Path $destDir)) {
            New-Item -Path $destDir -ItemType Directory -Force | Out-Null
        }
        
        # Compress using Windows built-in compression
        Compress-Archive -Path $Path -DestinationPath $zipPath -Force
        
        $zipSize = (Get-Item $zipPath).Length
        Write-Log "Compression complete. Archive created: $zipPath, Size: $([math]::Round($zipSize/1MB, 2)) MB"
        
    } catch {
        Write-Log "Compression failed: $($_.Exception.Message)" "ERROR"
    }
}

# Monitor folder for changes
function Invoke-MonitorFolder {
    param([string]$Path, [object]$Config)
    
    Write-Log "Starting folder monitoring for: $Path"
    
    if (-not (Test-Path $Path)) {
        Write-Log "Path does not exist: $Path" "ERROR"
        return
    }
    
    try {
        $watcher = New-Object System.IO.FileSystemWatcher
        $watcher.Path = $Path
        $watcher.IncludeSubdirectories = $true
        $watcher.EnableRaisingEvents = $true
        
        # Register event handlers
        $action = {
            $path = $Event.SourceEventArgs.FullPath
            $name = $Event.SourceEventArgs.Name
            $changeType = $Event.SourceEventArgs.ChangeType
            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            
            Write-Log "File $changeType: $name at $timestamp"
            
            # Auto-organize new files
            if ($changeType -eq "Created") {
                Start-Sleep -Seconds 2  # Wait for file to be fully written
                
                if (Test-Path $path) {
                    $file = Get-Item $path
                    $extension = $file.Extension.ToLower()
                    
                    if ($extension -in @(".pdf", ".xlsx", ".csv", ".json")) {
                        $targetFolder = switch ($extension) {
                            ".pdf" { "PDFs" }
                            ".xlsx" { "Excel" }
                            ".csv" { "Data" }
                            ".json" { "JSON" }
                        }
                        
                        $targetPath = Join-Path (Split-Path $path) $targetFolder
                        if (-not (Test-Path $targetPath)) {
                            New-Item -Path $targetPath -ItemType Directory -Force | Out-Null
                        }
                        
                        Move-Item -Path $path -Destination (Join-Path $targetPath $file.Name) -Force
                        Write-Log "Auto-organized: $name -> $targetFolder"
                    }
                }
            }
        }
        
        Register-ObjectEvent -InputObject $watcher -EventName "Created" -Action $action
        Register-ObjectEvent -InputObject $watcher -EventName "Changed" -Action $action
        Register-ObjectEvent -InputObject $watcher -EventName "Deleted" -Action $action
        
        Write-Log "Folder monitoring active. Press Ctrl+C to stop."
        
        # Keep monitoring until interrupted
        try {
            while ($true) {
                Start-Sleep -Seconds 1
            }
        } finally {
            $watcher.Dispose()
            Write-Log "Folder monitoring stopped."
        }
        
    } catch {
        Write-Log "Monitor failed: $($_.Exception.Message)" "ERROR"
    }
}

# Security scan
function Invoke-SecurityScan {
    param([string]$Path, [object]$Config)
    
    Write-Log "Starting security scan of: $Path"
    
    if (-not (Test-Path $Path)) {
        Write-Log "Path does not exist: $Path" "ERROR"
        return
    }
    
    try {
        $files = Get-ChildItem -Path $Path -Recurse -File
        $issues = @()
        
        foreach ($file in $files) {
            # Check file size
            if ($file.Length -gt $Config.MaxFileSize) {
                $issues += "Large file: $($file.Name) ($([math]::Round($file.Length/1MB, 2)) MB)"
            }
            
            # Check file extension
            if ($file.Extension.ToLower() -notin $Config.AllowedExtensions) {
                $issues += "Suspicious extension: $($file.Name)"
            }
            
            # Check for executable files
            if ($file.Extension.ToLower() -in @(".exe", ".bat", ".cmd", ".ps1", ".vbs", ".js")) {
                $issues += "Executable file: $($file.Name)"
            }
            
            # Check for hidden files
            if ($file.Attributes -band [System.IO.FileAttributes]::Hidden) {
                $issues += "Hidden file: $($file.Name)"
            }
        }
        
        if ($issues.Count -gt 0) {
            Write-Log "Security issues found:" "WARNING"
            foreach ($issue in $issues) {
                Write-Log "  - $issue" "WARNING"
            }
        } else {
            Write-Log "No security issues found."
        }
        
    } catch {
        Write-Log "Security scan failed: $($_.Exception.Message)" "ERROR"
    }
}

# Generate report
function Invoke-GenerateReport {
    param([string]$Path, [object]$Config)
    
    Write-Log "Generating report for: $Path"
    
    if (-not (Test-Path $Path)) {
        Write-Log "Path does not exist: $Path" "ERROR"
        return
    }
    
    try {
        $files = Get-ChildItem -Path $Path -Recurse -File
        $report = @{
            GeneratedAt = Get-Date
            Path = $Path
            TotalFiles = $files.Count
            TotalSize = ($files | Measure-Object -Property Length -Sum).Sum
            FileTypes = @{}
            LargestFiles = @()
            OldestFiles = @()
            RecentFiles = @()
        }
        
        # File type analysis
        $fileTypes = $files | Group-Object Extension
        foreach ($type in $fileTypes) {
            $report.FileTypes[$type.Name] = @{
                Count = $type.Count
                Size = ($type.Group | Measure-Object -Property Length -Sum).Sum
            }
        }
        
        # Largest files
        $report.LargestFiles = $files | Sort-Object Length -Descending | Select-Object -First 10 | ForEach-Object {
            @{
                Name = $_.Name
                Size = $_.Length
                SizeMB = [math]::Round($_.Length/1MB, 2)
                Path = $_.FullName
            }
        }
        
        # Oldest files
        $report.OldestFiles = $files | Sort-Object CreationTime | Select-Object -First 10 | ForEach-Object {
            @{
                Name = $_.Name
                Created = $_.CreationTime
                Path = $_.FullName
            }
        }
        
        # Recent files
        $report.RecentFiles = $files | Sort-Object CreationTime -Descending | Select-Object -First 10 | ForEach-Object {
            @{
                Name = $_.Name
                Created = $_.CreationTime
                Path = $_.FullName
            }
        }
        
        # Save report
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $reportPath = Join-Path $PSScriptRoot "..\reports\file-report_$timestamp.json"
        
        # Ensure reports directory exists
        $reportDir = Split-Path $reportPath
        if (-not (Test-Path $reportDir)) {
            New-Item -Path $reportDir -ItemType Directory -Force | Out-Null
        }
        
        $report | ConvertTo-Json -Depth 3 | Set-Content $reportPath
        
        Write-Log "Report generated: $reportPath"
        Write-Log "Total files: $($report.TotalFiles), Total size: $([math]::Round($report.TotalSize/1MB, 2)) MB"
        
    } catch {
        Write-Log "Report generation failed: $($_.Exception.Message)" "ERROR"
    }
}

# Schedule task
function Invoke-ScheduleTask {
    param([string]$Operation, [object]$Config)
    
    Write-Log "Scheduling task: $Operation"
    
    try {
        $taskName = "FinanceAI-FileManagement-$Operation"
        $scriptPath = $MyInvocation.MyCommand.Path
        
        # Create scheduled task
        $action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File `"$scriptPath`" -Operation $Operation"
        $trigger = New-ScheduledTaskTrigger -Daily -At "02:00"
        $settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Hours 2)
        
        Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Force
        
        Write-Log "Scheduled task created: $taskName"
        
    } catch {
        Write-Log "Task scheduling failed: $($_.Exception.Message)" "ERROR"
    }
}

# Show help
function Show-Help {
    Write-Host @"
FinanceAI Pro - File Management PowerShell Script

Usage: .\FileManagement.ps1 -Operation <operation> [options]

Operations:
  organize    - Organize files by type and date
  cleanup     - Clean up old files
  backup      - Backup files to specified location
  compress    - Compress files to ZIP archive
  monitor     - Monitor folder for changes
  security    - Scan for security issues
  report      - Generate file system report
  schedule    - Schedule automated tasks

Options:
  -Path         Source path (default: current directory)
  -Destination  Destination path (for backup/compress)
  -Pattern      File pattern to match (default: *)
  -Days         Number of days for cleanup (default: 30)
  -Force        Force operations without confirmation

Examples:
  .\FileManagement.ps1 -Operation organize -Path "C:\Downloads"
  .\FileManagement.ps1 -Operation cleanup -Path "C:\Temp" -Days 7 -Force
  .\FileManagement.ps1 -Operation backup -Path "C:\Important" -Destination "D:\Backups"
  .\FileManagement.ps1 -Operation monitor -Path "C:\Watch"
"@
}

# Main execution
if ($Operation -eq "help") {
    Show-Help
} else {
    Invoke-FileOperation -Op $Operation -SourcePath $Path -DestPath $Destination -FilePattern $Pattern -RetentionDays $Days -ForceOperation $Force
}