@echo off
title Pushing to GitHub...
cd /d "%~dp0"
echo ========================================================
echo  NOCTIS // Pushing to GitHub
echo  Repository: https://github.com/mahitejavelagapati/car-website.git
echo ========================================================
echo.
git push -u origin main
echo.
pause

