$ErrorActionPreference='Stop'
$projectRoot=Split-Path -Parent $PSScriptRoot
$parts=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'narration.json') -Raw | ConvertFrom-Json
$voiceDirectory=Join-Path $PSScriptRoot 'studio/public/narration'
New-Item -ItemType Directory -Path $voiceDirectory -Force | Out-Null
$speaker=New-Object -ComObject SAPI.SpVoice
$chineseVoice=$null
foreach($installedVoice in $speaker.GetVoices()){if($installedVoice.GetAttribute('Language') -eq '804'){$chineseVoice=$installedVoice;break}}
if(-not $chineseVoice){throw '未检测到简体中文SAPI语音。'}
$speaker.Voice=$chineseVoice
$speaker.Rate=0
$speaker.Volume=100
$clauseDirectory=Join-Path $PSScriptRoot 'capture/raw/voice-clauses'
New-Item -ItemType Directory -Path $clauseDirectory -Force | Out-Null
$ffprobe=Join-Path $PSScriptRoot 'studio/node_modules/@remotion/compositor-win32-x64-msvc/ffprobe.exe'
$timeline=@();$startFrame=0;$scriptLines=@()
for($index=0;$index -lt $parts.Count;$index++){
 $part=$parts[$index];$filename=$part.id+'.wav';$audioPath=Join-Path $voiceDirectory $filename
 $clauses=[regex]::Split($part.text,'(?<=[。！？：])') | Where-Object {$_}
 for($clauseIndex=0;$clauseIndex -lt $clauses.Count;$clauseIndex++){
  $clausePath=Join-Path $clauseDirectory ($part.id+'-'+$clauseIndex+'.wav')
  $stream=New-Object -ComObject SAPI.SpFileStream
  $stream.Format.Type=22 # 22.05kHz, 16-bit, mono PCM
  $stream.Open($clausePath,3,$false)
  try{$speaker.AudioOutputStream=$stream;$speaker.Speak($clauses[$clauseIndex],0) | Out-Null}finally{$stream.Close()}
 }
 $stream=New-Object -ComObject SAPI.SpFileStream;$stream.Format.Type=22;$stream.Open($audioPath,3,$false)
 try{$speaker.AudioOutputStream=$stream;$speaker.Speak($part.text,0) | Out-Null}finally{$stream.Close()}
 $probe=& $ffprobe -v error -show_format -of json $audioPath
 if($LASTEXITCODE -ne 0){throw '语音时长读取失败'}
 $seconds=[double](($probe | ConvertFrom-Json).format.duration)
 $frames=[Math]::Ceiling(($seconds+0.7)*30)
 $timeline+= [pscustomobject]@{id=$part.id;title=$part.title;screen=$part.screen;text=$part.text;audio='narration/'+$filename;startFrame=$startFrame;frames=$frames;audioSeconds=$seconds}
 $scriptLines+=$part.text
 $startFrame+=$frames
}
$timeline | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'studio/src/share-timeline.json') -Encoding utf8
$scriptLines -join "`n`n" | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'deliverables/日有回声-分享旁白.txt') -Encoding utf8
[pscustomobject]@{voice=$chineseVoice.GetDescription();provider='Windows SAPI, local synthesis';fps=30;frames=$startFrame;seconds=$startFrame/30;parts=$parts.Count} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'deliverables/narration-metadata.json') -Encoding utf8
'Narration completed: '+$startFrame/30+' seconds'
Push-Location $projectRoot
try{node promo/assemble-narration.mjs;if($LASTEXITCODE -ne 0){throw '语音与字幕组装失败'}}finally{Pop-Location}
