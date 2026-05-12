@echo off
title My-Drive Auto-Ecole — Launcher
color 0A

echo.
echo  =====================================================
echo   My-Drive Auto-Ecole — Starting Application
echo  =====================================================
echo.

REM ── Check Node.js ─────────────────────────────────────
where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  [ERROR] Node.js is not installed or not in PATH.
    echo  Please install Node.js from https://nodejs.org
    echo.
    pause
    exit /b 1
)

REM ── Check npm ─────────────────────────────────────────
where npm >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  [ERROR] npm is not found. Please reinstall Node.js.
    echo.
    pause
    exit /b 1
)

REM ── Check .env files — abort if placeholders remain ───
set ENV_OK=1

findstr /C:"YOUR_PROJECT_ID" "%~dp0.env" >nul 2>&1
if %errorlevel%==0 (
    color 0C
    echo  [ERROR] Frontend .env has not been configured yet.
    echo.
    echo  Open the file:  %~dp0.env
    echo  and replace the placeholder values with your real
    echo  Supabase URL and anon key.
    echo.
    echo  Example:
    echo    VITE_SUPABASE_URL=https://abcxyz.supabase.co
    echo    VITE_SUPABASE_ANON_KEY=eyJhbGci...
    echo.
    set ENV_OK=0
)

findstr /C:"YOUR_PROJECT_ID" "%~dp0backend\.env" >nul 2>&1
if %errorlevel%==0 (
    color 0C
    echo  [ERROR] Backend .env has not been configured yet.
    echo.
    echo  Open the file:  %~dp0backend\.env
    echo  and replace the placeholder values with your real
    echo  Supabase URL and service_role key.
    echo.
    echo  Example:
    echo    SUPABASE_URL=https://abcxyz.supabase.co
    echo    SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
    echo.
    set ENV_OK=0
)

if %ENV_OK%==0 (
    color 0C
    echo  =====================================================
    echo   Cannot start — fix the .env files above first.
    echo  =====================================================
    echo.
    pause
    exit /b 1
)

color 0A

REM ── Install backend dependencies ──────────────────────
echo  [1/4] Installing backend dependencies...
echo  -----------------------------------------------
cd /d "%~dp0backend"
call npm install --silent
if %errorlevel% neq 0 (
    echo  [ERROR] Backend npm install failed.
    pause
    exit /b 1
)
echo  Backend dependencies OK.
echo.

REM ── Install frontend dependencies ─────────────────────
echo  [2/4] Installing frontend dependencies...
echo  -----------------------------------------------
cd /d "%~dp0"
call npm install --silent
if %errorlevel% neq 0 (
    echo  [ERROR] Frontend npm install failed.
    pause
    exit /b 1
)
echo  Frontend dependencies OK.
echo.

REM ── Start Backend Server ──────────────────────────────
echo  [3/4] Starting Backend Server (port 3001)...
echo  -----------------------------------------------
start "My-Drive Backend" cmd /k "cd /d "%~dp0backend" && echo  Backend starting... && node server.js"

REM ── Wait for backend to be ready (max 20 seconds) ────
echo  Waiting for backend to start...
set WAIT_COUNT=0

:WAIT_LOOP
if %WAIT_COUNT% GEQ 20 goto BACKEND_TIMEOUT
timeout /t 1 /nobreak >nul
powershell -NoProfile -Command "try { Invoke-WebRequest -Uri 'http://localhost:3001/health' -UseBasicParsing -TimeoutSec 1 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel%==0 goto BACKEND_READY
set /A WAIT_COUNT=%WAIT_COUNT%+1
goto WAIT_LOOP

:BACKEND_TIMEOUT
echo  [WARNING] Backend did not respond in time. Proceeding anyway.
goto SKIP_ADMIN

:BACKEND_READY
echo  Backend is ready!
echo.

REM ── Create default admin account via PowerShell ───────
echo  -----------------------------------------------
echo   Creating default admin account...
echo  -----------------------------------------------

set RESULT_FILE=%TEMP%\mydrive_admin_result.txt

powershell -NoProfile -Command ^
  "$body = '{\"email\":\"admin@mydrive.com\",\"password\":\"Admin@MyDrive2026!\",\"userData\":{\"fullName\":\"Admin My-Drive\",\"phone\":\"0555000000\",\"role\":\"admin\"}}';" ^
  "try {" ^
  "  $r = Invoke-RestMethod -Uri 'http://localhost:3001/admin/create-user' -Method POST -ContentType 'application/json' -Body $body -TimeoutSec 15;" ^
  "  'CREATED' | Out-File -FilePath '%RESULT_FILE%' -Encoding utf8" ^
  "} catch {" ^
  "  $msg = $_.ToString();" ^
  "  if ($msg -match 'already') { 'EXISTS' | Out-File -FilePath '%RESULT_FILE%' -Encoding utf8 }" ^
  "  else { ('FAILED: ' + $msg) | Out-File -FilePath '%RESULT_FILE%' -Encoding utf8 }" ^
  "}"

if not exist "%RESULT_FILE%" goto ADMIN_FAILED

findstr /C:"CREATED" "%RESULT_FILE%" >nul 2>&1
if %errorlevel%==0 goto ADMIN_CREATED

findstr /C:"EXISTS" "%RESULT_FILE%" >nul 2>&1
if %errorlevel%==0 goto ADMIN_EXISTS

goto ADMIN_FAILED

:ADMIN_CREATED
echo.
echo  =====================================================
echo   [SUCCESS] Admin account created successfully!
echo  =====================================================
echo.
echo   Email    :  admin@mydrive.com
echo   Password :  Admin@MyDrive2026^!
echo   Role     :  admin
echo.
echo  =====================================================
echo.
goto ADMIN_DONE

:ADMIN_EXISTS
echo.
echo  [INFO] Admin account already exists in the database.
echo   Email    :  admin@mydrive.com
echo   Password :  Admin@MyDrive2026^!
echo.
goto ADMIN_DONE

:ADMIN_FAILED
echo.
echo  [WARNING] Could not create admin account automatically.
echo  Check the backend window for error details.
echo  You can create one manually at: http://localhost:5173/test
echo.

:ADMIN_DONE
if exist "%RESULT_FILE%" del "%RESULT_FILE%" >nul 2>&1

:SKIP_ADMIN

REM ── Start Frontend Dev Server ─────────────────────────
echo  [4/4] Starting Frontend Dev Server (port 5173)...
echo  -----------------------------------------------
start "My-Drive Frontend" cmd /k "cd /d "%~dp0" && echo  Frontend starting... && npm run dev"

echo.
echo  =====================================================
echo   Both servers are starting in separate windows.
echo  =====================================================
echo.
echo   Frontend :  http://localhost:5173
echo   Backend  :  http://localhost:3001
echo   Health   :  http://localhost:3001/health
echo.
echo   ---- Default Admin Login ----
echo   Email    :  admin@mydrive.com
echo   Password :  Admin@MyDrive2026^!
echo.
echo   Close the Backend/Frontend windows to stop them.
echo   Press any key to open the browser automatically...
echo.
pause >nul

start "" "http://localhost:5173"
