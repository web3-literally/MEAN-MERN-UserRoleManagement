let View = require('../views/base');
let path = require('path');
let fs = require('fs');
let crypto = require('crypto');
let nodemailer = require('nodemailer');
let config = require('../config/index')();
let transporter = nodemailer.createTransport({
    host: config.mail_info.host,
    port: 587,
    secure: false,
    auth: {
        user: config.mail_info.user,
        pass: config.mail_info.password
    }
});
let ejs = require('ejs');
let speakeasy = require('speakeasy');

let BaseController = require('./BaseController');
let UserModel = require('../models/admin_ms/UserModel');

module.exports = BaseController.extend({
    name: 'UserController',

    account_settings: async function (req, res, next) {
        let user = await UserModel.findOne({id: req.session.user.id});
        let v = new View(res, 'settings/account_settings');
        v.render({
            title: 'MotorCut|Profile',
            session: req.session,
            i18n: res,
            tab_text: 'settings',
            sub_text: 'settings_profile',
            user: user,
        })
    },
    editProfile: async function (req, res, next) {
        let username = req.body.username, email = req.body.email,
            old_password = req.body.old_password, new_password = req.body.new_password;
        let user = await UserModel.findOne({id: req.session.user.id});
        if (user.email !== email) return res.send({status: 'error', message: res.cookie().__('Undefined user')});
        if (!user.verifyPassword(old_password)) return res.send({status: 'error', message: res.cookie().__('Old password is not correct')});
        user.username = username;
        user.password = new_password;
        await user.save();
        req.session.user = user;
        return res.send({status: 'success', message: res.cookie().__('Updated user profile successfully')});
    },
    changeAvatar: async function (req, res, next) {
        let user = await UserModel.findOne({id: req.session.user.id});
        let avatarPath = user.avatar;
        if (req.body.avatarImg.length > 1000) {
            let avatarData = req.body.avatarImg.replace(/^data:image\/\w+;base64,/, "");
            let file_extension = '.png';
            if (avatarData.charAt(0) === '/') file_extension = '.jpg';
            else if (avatarData.charAt(0) === 'R') file_extension = '.gif';
            let public_path = path.resolve('public');
            avatarPath = '/avatars/avatar_' + user.id + file_extension;
            let avatarUploadPath = path.resolve('public') + avatarPath;
            fs.writeFileSync(avatarUploadPath, avatarData, 'base64');
        }
        await user.updateOne({avatar: avatarPath});
        req.session.user.avatar = avatarPath;
        return res.send({status: 'success', message: res.cookie().__('Changed avatar successfully'), avatarPath: avatarPath});
    },
    error: function (req, res, next) {
        let v = new View(res, 'partials/error');
        v.render({
            title: 'MotorCut|Error',
            session: req.session,
            i18n: res,
        })
    },


    dashboard: async function (req, res, next) {
        let user = req.session.user;
        let v = new View(res, 'admin_vs/dashboard');
        v.render({
            title: 'MotorCut|Dashboard',
            session: req.session,
            i18n: res,
            tab_text: 'admin_dashboard',
            sub_text: '',
            user: user,
        })
    },
    clientManagement: async function (req, res, next) {
        let user = req.session.user;
        let users = await UserModel.find({role:2});
        let v = new View(res, 'admin_vs/client_manage');
        v.render({
            title: 'MotorCut|Client Management',
            session: req.session,
            i18n: res,
            tab_text: 'admin_client_management',
            sub_text: '',
            user: user,
            users: users,
        })
    },
    editUser: async function (req, res, next) {
        let type = req.body.type;

        if (type == "add")
        {
            let username = req.body.username;
            let email = req.body.email;
            let phone = req.body.phone;
            let password = req.body.password;

            let new_user = new UserModel({
                username: username,
                email: email,
                phone:phone,
                password: password,
                online_state: false,
                email_verify_flag: 2,
                phone_verify_flag: 2,
                reset_flag: 2,
                role: 2,
            });
            await new_user.save();
            return res.send({status: 'success', message: res.cookie().__('Registered New User Successfully')});
        }
        if (type == "edit")
        {
            let id = req.body.id;
            let username = req.body.username;
            let email = req.body.email;
            let phone = req.body.phone;
            let password_flag = req.body.password_flag;
            let password = req.body.password;

            let user = await UserModel.findOne({id: id});
            if (!user) return res.send({status: 'error', message: res.cookie().__('Undefined user')});

            await user.updateOne({username: username, email: email, phone: phone});

            if (password_flag == 'true') {
                //console.log(password_flag);
                await user.updateOne({password: crypto.createHash('md5').update(password).digest('hex')})
            }
            return res.send({status: 'success', message: res.cookie().__('Updated user profile successfully')});
        }
        if (type == "active")
        {
            let id = req.body.id;
            let user = await UserModel.findOne({id: id});
            if (!user) return res.send({status: 'error', message: res.cookie().__('Undefined user')});

            await user.updateOne({aprove_status: 'ACTIVE'});
            return res.send({status: 'success', message: res.cookie().__('User Account Actived!')});
        }
        if (type == "block")
        {
            let id = req.body.id;
            let user = await UserModel.findOne({id: id});
            if (!user) return res.send({status: 'error', message: res.cookie().__('Undefined user')});

            await user.updateOne({aprove_status: 'BLOCK'});
            return res.send({status: 'success', message: res.cookie().__('User Account Blocked!')});
        }
    },
});
