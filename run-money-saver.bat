@echo off
REM ===== Money-Saver project runner in Windows Terminal (two tabs) =====
REM This script opens one Windows Terminal window with:
REM  - Tab 1: FastAPI backend (uvicorn) in /backend
REM  - Tab 2: SvelteKit frontend (npm run dev) in /frontend
REM It uses paths relative to this .bat file so you can double-click from anywhere.

REM --- Resolve project directories relative to this script ---
set "BASE_DIR=%~dp0"
REM strip trailing backslash if present (for cleaner echo only)
if "%BASE_DIR:~-1%"=="\" set "BASE_DIR=%BASE_DIR:~0,-1%"

set "BACKEND_DIR=%BASE_DIR%\backend"
set "FRONTEND_DIR=%BASE_DIR%\frontend"

REM --- Sanity checks (helpful messages if folders are missing) ---
if not exist "%BACKEND_DIR%" (
  echo [ERROR] Backend folder not found: "%BACKEND_DIR%"
  echo Make sure this .bat sits next to the "backend" folder.
  pause
  exit /b 1
)
if not exist "%FRONTEND_DIR%" (
  echo [ERROR] Frontend folder not found: "%FRONTEND_DIR%"
  echo Make sure this .bat sits next to the "frontend" folder.
  pause
  exit /b 1
)

REM --- Commands to run in each tab ---
REM NOTE: We DO NOT 'cd' inside the command; instead we let Windows Terminal
REM start each tab in the right working directory with -d (startingDirectory).
set "BACKEND_CMD=powershell -NoExit -Command uvicorn app.main:app --reload"
set "FRONTEND_CMD=powershell -NoExit -Command npm run dev -- --host"

REM --- Launch Windows Terminal with two tabs, each in its own working directory ---
REM Requires Windows Terminal (wt.exe). On Windows 11 it's built-in.
wt ^
  new-tab -d "%BACKEND_DIR%" --title "Money-Saver Backend" %BACKEND_CMD% ^
  ; new-tab -d "%FRONTEND_DIR%" --title "Money-Saver Frontend" %FRONTEND_CMD%

REM When wt exits immediately, it means it handed off to the Terminal window successfully.
REM Both tabs will remain open because we used PowerShell -NoExit.

REM --- Launch Microsoft Edge to frontend ---
REM Adjust port if different from 5173
start msedge http://localhost:5173

