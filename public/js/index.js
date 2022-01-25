const socket = io('ws://localhost:3000');
let username;
let avatar;

/**
 *鼠标划过的CSS处理 
 */

$('.avatar-box li').on('click', function () {
    $(this).addClass('avatar-hover').siblings().removeClass('avatar-hover');
})

/**
 * 用户登录请求
 */

$('.login .send-btn').on('click', function () {
    username = $('.login-input').val().trim()
    avatar = $('.avatar-box .avatar-hover img').attr('src');
    if (!username || !avatar)
        return;
    socket.emit('loginMessage', {
        username: username,
        avatar: avatar
    });

});

/**
 * 登陆成功
 */

socket.on('loginSuccess', (data) => {
    console.log(data)
    if (data.code === 1) {
        $('.login-box').hide();
        $('.container-box').show();

        let myUser = `
            <img src="${avatar}" alt="" class="user-avatar">
            <span class="username">${username}</span>
        `;
        $('.user-info').html(myUser);
    }

})

/**
 * 登陆失败
 */

socket.on('loginError', (data) => {
    if (data.code == 0)
        console.log('登录失败，用户存在');
})

/**
 *  提示消息处理公共方法 
 * @param {string} userName
 * @param {string} act
 */
function tips(userName, act) {
    let time = setTime();
    let tipsHtml = ` 
        <div class="tips">
            <h5>${userName}${act}了群聊</h5>
        </div>
        <div class="time">${time}</div>
    `;
    $('.message-box').append(tipsHtml);
    scrollIntoView();
}
/**
 * 
 */
function setTime() {
    let date = new Date();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    if (minutes < 10) {
        minutes = '0' + minutes;
    }
    return hours + ":" + minutes;
}




/**
 * 提示有用户加入聊天室
 */

socket.on('userTips', (data) => {
    tips(data.username, '加入');
})


/**
 * 列表渲染的公共方法
 * @param {array} newData
 */

function userList(newData) {
    let userhtml = '';
    newData.forEach(item => {
        userhtml += `
            <li class="user-item">
                <img src="${item.avatar}" alt="" class="item-avatar">
                <span class="username">${item.username}</span>
            </li>
        `;
    })
    $('.user-list ul').html(userhtml);

    //更新聊天室人数
    $('.header-title').text(`聊天室(${newData.length + 1})`);
}

/**
 * 提示有用户离开聊天室
 */

socket.on('deleteUser', (data) => {
    if (!data.username)
        return;
    tips(data.username, '离开');
})


/**
 * 登录成功用户列表渲染
 */

socket.on('userList', (data) => {
    // 排除自己的信息
    let newData = data.filter(item => item.username != username)
    userList(newData);
})

/**
 * 点击发送消息
 */
$('.btn-send').on('click', function () {
    sendMessage();
})

/**
 *  键盘发送消息
 */

$(document).keydown(function (event) {
    let keyCode = event.keyCode;
    let ctrlKey = event.ctrlKey;
    if (keyCode === 13 && ctrlKey) {
        sendMessage();
    }
})

/**
 * 发送消息的公共方法
 */

function sendMessage() {
    let content = $('.edit-msg').html().trim();
    if (!content) {
        alert('内容不能为空');
    } else {
        let message = {
            username: username,
            avatar: avatar,
            content: content
        };
        socket.emit('sendMessage', message);
        $('.edit-msg').html('').blur();
    }
}

//接受服务端消息
socket.on('receiveMessage', (data) => {
    if (data.username === username) {
        //自己的信息
        let myMessage = `
            <div class="my-box">
                <div class="my-msg">${data.content}</div>
                <img src="${data.avatar}" alt="" class="my-avatar">
            </div>
        `;
        $('.message-box').append(myMessage);

    } else {
        let otherMessage = `
            <div class="other-box">
                <div class="other-info">
                    <img src="${data.avatar}" alt="" class="nickname-avatar">
                </div>
                <div class="other-msg-box">
                    <h5 class="nickname">${data.username}</h5>
                    <div class="other-msg">${data.content}</div>
                </div>

            </div>
        `;
        $('.message-box').append(otherMessage);
    }
    scrollIntoView();
})

/**
 * 滚动到底部
 */

function scrollIntoView() {
    // $('.message-box').children(':last').get(0).scrollIntoView(false);
    $('.message-box').children(':last-child').get(0).scrollIntoView(false);
}

/**
 * 发送图片
 */

$('#file').on('change', function () {
    let file = this.files[0];
    if (!/\.(gif|jpg|jpeg|png|GIF|JPG|PNG)$/.test(file.name)) {
        alert("图片类型必须是gif,jpeg,jpg,png中的一种");
        return;
    }
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function () {
        socket.emit('sendImage', {
            username: username,
            avatar: avatar,
            image: reader.result,
            type: 'image'
        })
        $('#file').val('');
    }
})

/**
 * 接受服务端图片
 */
socket.on('receiveImage', (data) => {
    console.log(data);
    if (data.username === username) {
        //自己的信息
        let myMessageImage = `
            <div class="my-box">
            <img src="${data.image}" alt="" class="my-image">
              
                <img src="${data.avatar}" alt="" class="my-avatar">
            </div>
        `;
        //     <div class="my-image-box">
        //     <img src="${data.image}" alt="" class="my-image">
        // </div>
        $('.message-box').append(myMessageImage);

    } else {
        let otherMessageImage = `
            <div class="other-box">
                <div class="other-info">
                    <img src="${data.avatar}" alt="" class="nickname-avatar">
                </div>
                <div class="other-msg-box">
                    <h5 class="nickname">${data.username}</h5>
                    <div class="other-image-box">
                        <img src="${data.image}" alt="" class="other-image">
                    </div>
                   
                </div>

            </div>
        `;
        $('.message-box').append(otherMessageImage);
    }
    $('.message-box img:last').on('load', function () {
        scrollIntoView();
    })

})



/**
 * 表情事件
 */

//显示表情
$('.face').on('click', function () {
    $('#edit-msg').emoji({
        button: '.face',
        showTab: false,
        animation: 'slide',
        position: 'topRight',
        icons: [
            {
                name: "QQ高清",
                path: "lib/img/qq/",
                maxNum: 91,
                excludeNums: [41, 45, 54],
                file: ".gif",
                placeholder: "#qq_{alias}#"
            },
            {
                name: "贴吧表情",
                path: "lib/img/tieba/",
                maxNum: 50,
                file: ".jpg",
                placeholder: ":{alias}:",
                alias: {
                    1: "hehe",
                    2: "haha",
                    3: "tushe",
                    4: "a",
                    5: "ku",
                    6: "lu",
                    7: "kaixin",
                    8: "han",
                    9: "lei",
                    10: "heixian",
                    11: "bishi",
                    12: "bugaoxing",
                    13: "zhenbang",
                    14: "qian",
                    15: "yiwen",
                    16: "yinxian",
                    17: "tu",
                    18: "yi",
                    19: "weiqu",
                    20: "huaxin",
                    21: "hu",
                    22: "xiaonian",
                    23: "neng",
                    24: "taikaixin",
                    25: "huaji",
                    26: "mianqiang",
                    27: "kuanghan",
                    28: "guai",
                    29: "shuijiao",
                    30: "jinku",
                    31: "shengqi",
                    32: "jinya",
                    33: "pen",
                    34: "aixin",
                    35: "xinsui",
                    36: "meigui",
                    37: "liwu",
                    38: "caihong",
                    39: "xxyl",
                    40: "taiyang",
                    41: "qianbi",
                    42: "dnegpao",
                    43: "chabei",
                    44: "dangao",
                    45: "yinyue",
                    46: "haha2",
                    47: "shenli",
                    48: "damuzhi",
                    49: "ruo",
                    50: "OK"
                },
                title: {
                    1: "呵呵",
                    2: "哈哈",
                    3: "吐舌",
                    4: "啊",
                    5: "酷",
                    6: "怒",
                    7: "开心",
                    8: "汗",
                    9: "泪",
                    10: "黑线",
                    11: "鄙视",
                    12: "不高兴",
                    13: "真棒",
                    14: "钱",
                    15: "疑问",
                    16: "阴脸",
                    17: "吐",
                    18: "咦",
                    19: "委屈",
                    20: "花心",
                    21: "呼~",
                    22: "笑脸",
                    23: "冷",
                    24: "太开心",
                    25: "滑稽",
                    26: "勉强",
                    27: "狂汗",
                    28: "乖",
                    29: "睡觉",
                    30: "惊哭",
                    31: "生气",
                    32: "惊讶",
                    33: "喷",
                    34: "爱心",
                    35: "心碎",
                    36: "玫瑰",
                    37: "礼物",
                    38: "彩虹",
                    39: "星星月亮",
                    40: "太阳",
                    41: "钱币",
                    42: "灯泡",
                    43: "茶杯",
                    44: "蛋糕",
                    45: "音乐",
                    46: "haha",
                    47: "胜利",
                    48: "大拇指",
                    49: "弱",
                    50: "OK"
                }
            }, {
                name: "emoji高清",
                path: "lib/img/emoji/",
                maxNum: 84,
                file: ".png",
                placeholder: "#emoji_{alias}#"
            }]

    })
})



