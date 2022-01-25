const express = require('express');
const path = require('path');
const http = require('http');
const app = express();
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

/**
 * 记录用户列表
 */
const users = [];

/**
 * 设置静态资源目录
 */
app.use(express.static(path.join(__dirname, '/public')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/index.hmtl'))
})

/**
 * socket连接
 */
io.on('connection', (socket) => {
    console.log('新用户连接成功')

    // 登录消息处理
    socket.on('loginMessage', (data) => {
        // 验证用户是否存在
        let user = users.find(item => item.username === data.username);
        if (user) {
            socket.emit('loginError', { code: 0 });
        } else {
            users.push(data);
            socket.username = data.username;
            socket.avatar = data.avatar;
            socket.emit('loginSuccess', { code: 1 });


            //广播所有人连接更新
            io.emit('userList', users);

            //广播有人加入聊天室
            io.emit('userTips', data);
        }
    })

    //监听用户离开
    socket.on('disconnect', () => {
        let idx = users.findIndex(item => item.username === socket.username);
        users.splice(idx, 1);

        //广播所以人删除
        io.emit('deleteUser', { username: socket.username });

        //广播用户离开列表
        io.emit('userList', users);
    })

    //监听收到的聊天消息
    socket.on('sendMessage', (data) => {
        // socket.emit('broadcast', data);
        io.emit('receiveMessage', data);
    })

    //用户发送的图片
    socket.on('sendImage', (data) => {
        if (data.type === 'image') {
            io.emit("receiveImage",data);
        }
    })
})

server.listen(3000, () => {
    console.log('服务器启动成功');
})