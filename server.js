const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express(); // iniciando servidor express
const server = http.createServer(app); // criando server

const io = new Server(server); //Web Socker

app.get('/', (req, res) =>{
    res.sendFile(__dirname + '/index.html')
});

let esperandoUsuario = null;

io.on('connection', (socket) =>{
    console.log("Um usuário se conectou");
    
    socket.on('set username', (username) =>{
        socket.username = username;
        // quem conectou na sala
        console.log(`${username} entrou na sala`);
        
        if(esperandoUsuario){
            // se há usuario esperando, junta os dois
            socket.partner = esperandoUsuario;
            esperandoUsuario.partner = socket;
            // notificar os usuários conectados
            esperandoUsuario.emit('chat start', `Falando com: ${socket.username}`);
            socket.emit('chat start', `falando com: ${esperandoUsuario.username}`);
            // zeramos o usuário que está esperando
            esperandoUsuario = null;
        } else{
            // caso ninguém esperando, coloco como o próximo
            esperandoUsuario = socket;
            socket.emit('waiting', 'Aguardando um usuário...')
        }
    })
    
    socket.on('chat message', (msg) =>{
        if(socket.partner){
            socket.partner.emit("chat message", `${socket.username}: ${msg}`)
        }
    })

    socket.on('manual disconnect', () =>{
        if(socket.partner){
            socket.partner.emit('chat end', `${socket.username} desconectou`);
            socket.partner.partner = null;
            socket.partner = null;
        }
        socket.emit('chat end', 'Você desconectou.')
    })

    socket.on('disconnect', () =>{
        console.log("Um usuário se desconectou");
        if(socket.partner){
            socket.partner.emit('chat end', `socket.username desconectou`);
            socket.partner.partner = null;
        }
        if(esperandoUsuario === socket) {
            esperandoUsuario = null;
        }
    })
})

server.listen(3000, () =>{
    console.log('servidor na porta 3000');
});