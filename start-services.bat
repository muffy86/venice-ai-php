@echo off
echo Starting Venice AI Services...

echo Starting Docker services...
docker-compose up -d

echo Waiting for services to start...
timeout /t 10

echo Services started:
echo - Redis: localhost:6379
echo - MySQL: localhost:3306
echo - N8N: http://localhost:5678
echo.
echo N8N Login: admin / venice123
echo MySQL: venice / venice123
echo.
echo All services ready!
pause