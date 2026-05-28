@echo off
:: ─────────────────────────────────────────────────────────────
:: start-compreface.bat
:: Starts CompreFace Docker containers before Express backend.
::
:: HOW IT WORKS:
::   1. Checks if Docker Desktop is running
::   2. Navigates to CompreFace docker-compose directory
::   3. Starts containers with docker-compose up -d (detached)
::   4. Waits for CompreFace to be ready on port 8000
::   5. Exits — Express backend starts after this script
::
:: USAGE:
::   Called automatically by npm run dev
::   Do NOT run this manually
:: ─────────────────────────────────────────────────────────────

echo.
echo [SmartBank] Starting CompreFace Docker containers...
echo.

:: ── Step 1: Check Docker Desktop is running ──
docker info >nul 2>&1
if %errorlevel% neq 0 (
  echo [ERROR] Docker Desktop is not running.
  echo         Please start Docker Desktop and try again.
  echo.
  pause
  exit /b 1
)

echo [OK] Docker Desktop is running.

:: ── Step 2: Navigate to your CompreFace docker-compose folder ──
:: IMPORTANT: Change this path to where YOUR docker-compose.yml is
set COMPREFACE_DIR=C:\Users\siddh\Downloads\CompreFace_1.2.0

if not exist "%COMPREFACE_DIR%\docker-compose.yml" (
  echo [ERROR] docker-compose.yml not found at: %COMPREFACE_DIR%
  echo         Update COMPREFACE_DIR in this script.
  pause
  exit /b 1
)

cd /d "%COMPREFACE_DIR%"

:: ── Step 3: Start containers (detached mode = runs in background) ──
echo [SmartBank] Running: docker-compose up -d ...
docker-compose up -d

if %errorlevel% neq 0 (
  echo [ERROR] docker-compose failed to start containers.
  pause
  exit /b 1
)

echo.
echo [OK] CompreFace containers started.
echo      Waiting for CompreFace to become ready on port 8000...
echo.

:: ── Step 4: Wait until CompreFace API is responding ──
:: Polls http://localhost:8000/actuator/health every 3 seconds
:: Gives up after 20 attempts (60 seconds total)
set /a attempts=0
set /a max_attempts=20

:health_check
set /a attempts+=1

:: Try to reach CompreFace health endpoint using curl
curl -s -o nul -w "%%{http_code}" http://localhost:8000/actuator/health > temp_status.txt 2>nul
set /p status=<temp_status.txt
del temp_status.txt 2>nul

if "%status%"=="200" (
  echo [OK] CompreFace is ready! ^(attempt %attempts%^)
  echo.
  goto :done
)

if %attempts% geq %max_attempts% (
  echo [WARNING] CompreFace did not respond after 60 seconds.
  echo           Starting backend anyway — recognition may fail on first request.
  echo.
  goto :done
)

echo [Waiting] CompreFace not ready yet... ^(attempt %attempts%/%max_attempts%^)
timeout /t 3 /nobreak >nul
goto :health_check

:done
echo [SmartBank] CompreFace startup sequence complete.
echo.