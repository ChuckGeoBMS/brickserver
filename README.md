# brickserver
Brick Server API

Run natively:\
export DB_HOST=localhost\
export DB_PORT=5432\
export PORT=3010\
npm start

Docker container:\
docker build --build-arg PORT=3010 --tag bs:0.9.0 .\
docker run --env PORT=3010 --env DB_HOST=db --env DB_PORT=5432 --env WEB_HOST=localhost --env WEB_PORT=3000 --rm --publish 3010:3010 --detach --name bs bs:0.9.0\
docker tag bs:0.9.0 geobms/bs:0.9.0\
docker push geobms/bs:0.9.0
