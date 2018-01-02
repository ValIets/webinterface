import config from './config';

const socket = new WebSocket(
    `ws://${config.server.ip}:${config.server.port}`
);

socket.onMessage = (event) => {
    setInterval(() => {
        socket.send('Ping!');
        console.log('Pinged to server.');
    }, 1000);
};
