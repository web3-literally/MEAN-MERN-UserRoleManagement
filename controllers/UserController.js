let View = require('../views/base');
let path = require('path');
let request = require('request');
let fs = require('fs');
let crypto = require('crypto');
let ejs = require('ejs');
let config = require('../config/index')();
let config_limit = 500000;
let nodemailer = require('nodemailer');
let transporter = nodemailer.createTransport({
    host: config.mail_info.host,
    port: 587,
    secure: false,
    auth: {
        user: config.mail_info.user,
        pass: config.mail_info.password
    }
});
let BaseController = require('./BaseController');
let UserModel = require('../models/admin_ms/UserModel');

module.exports = BaseController.extend({
    name: 'HomeController',

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
        let user_item = await UserModel.findOne({id: user.id});
        let v = new View(res, 'user_vs/dashboard');
        v.render({
            title: 'MotorCut|Dashboard',
            session: req.session,
            i18n: res,
            tab_text: 'user_dashboard',
            sub_text: '',
            user: user_item,
        })
    },
});
