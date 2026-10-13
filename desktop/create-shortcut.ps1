$ErrorActionPreference='Stop'
$projectDir=Split-Path -Parent $PSScriptRoot
$version=(Get-Content -LiteralPath (Join-Path $projectDir 'package.json') -Raw | ConvertFrom-Json).version
$target=Join-Path $projectDir "dist/releases/$version/DayCompanion-win32-x64/DayCompanion.exe"
if(-not (Test-Path -LiteralPath $target)){throw '请先生成Windows应用包。'}
$desktopDir=[Environment]::GetFolderPath('Desktop')
$shortcutPath=Join-Path $desktopDir '日有回声.lnk'
$shell=New-Object -ComObject WScript.Shell
if(Test-Path -LiteralPath $shortcutPath){
  $existing=$shell.CreateShortcut($shortcutPath)
  $existingIsOurApp=$existing.TargetPath -eq (Join-Path $projectDir 'dist/DayCompanion-win32-x64/DayCompanion.exe')
  if($existing.TargetPath){$oldFull=[IO.Path]::GetFullPath($existing.TargetPath);$releaseRoot=[IO.Path]::GetFullPath((Join-Path $projectDir 'dist/releases'))+[IO.Path]::DirectorySeparatorChar;$existingIsOurApp=$existingIsOurApp -or ($oldFull.StartsWith($releaseRoot,[StringComparison]::OrdinalIgnoreCase) -and [IO.Path]::GetFileName($oldFull) -eq 'DayCompanion.exe')}
  if($existing.TargetPath -ne $target -and -not $existingIsOurApp){$shortcutPath=Join-Path $desktopDir '日有回声（成长陪伴）.lnk';if(Test-Path -LiteralPath $shortcutPath){throw '同名快捷方式已有其他目标，未覆盖。'}}
}
$shortcut=$shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath=$target
$shortcut.WorkingDirectory=Split-Path -Parent $target
$shortcut.IconLocation=Join-Path $projectDir 'assets/icon.ico'
$shortcut.Description='日有回声：每日回望、成长目标与AI陪伴'
$shortcut.Save()
$verified=$shell.CreateShortcut($shortcutPath)
if($verified.TargetPath -ne $target){throw '快捷方式目标验证失败。'}
Write-Output "桌面快捷方式已创建并核对：$shortcutPath"
