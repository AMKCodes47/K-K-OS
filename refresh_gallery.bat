@echo off
cd /d "%~dp0"
py -3 refresh_gallery.py
if errorlevel 1 python refresh_gallery.py
if errorlevel 1 (
  echo.
  echo Could not run Python. Install Python 3 and tick "Add Python to PATH", then try again.
  pause
  exit /b 1
)
echo.
pause
