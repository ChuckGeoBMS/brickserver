# brickserver
Brick Server API

Run natively:\
export DB_HOST=localhost\
export DB_PORT=5432\
export PORT=3010\
npm start

Docker container:\
docker build --build-arg PORT=3010 --tag brickserver:0.9.2 .\
docker run --env PORT=3010 --env DB_HOST=db --env DB_PORT=5432 --env WEB_HOST=localhost --env WEB_PORT=3000 --rm --publish 3010:3010 --detach --name bs brickserver:0.9.2\
docker tag brickserver:0.9.2 geobms/brickserver:0.9.2\
docker push geobms/brickserver:0.9.0
