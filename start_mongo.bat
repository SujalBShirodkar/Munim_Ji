@echo off
echo Starting MongoDB on port 27017...
if not exist ".data\db" mkdir ".data\db"

if exist ".tools\mongodb-win32-x86_64-windows-7.0.14\bin\mongod.exe" (
    ".tools\mongodb-win32-x86_64-windows-7.0.14\bin\mongod.exe" --dbpath .data\db --port 27017 --bind_ip 127.0.0.1
) else (
    mongod --dbpath .data\db --port 27017 --bind_ip 127.0.0.1
)
pause

