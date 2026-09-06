@echo off
echo Starting MongoDB replica set (rs0) on port 27018...
if not exist ".mongo_data" mkdir ".mongo_data"

REM Try default MongoDB 8.3 path, then fallback to mongod in PATH
if exist "C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe" (
    "C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe" --dbpath .mongo_data --port 27018 --replSet rs0
) else if exist "C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe" (
    "C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe" --dbpath .mongo_data --port 27018 --replSet rs0
) else if exist "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" (
    "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath .mongo_data --port 27018 --replSet rs0
) else (
    mongod --dbpath .mongo_data --port 27018 --replSet rs0
)
pause
