'use strict';

const Controller = require('egg').Controller;
const captcha = require('nodejs-captcha');
class HomeController extends Controller {
  async index() {
    const ret = captcha();
    ret.width=115;
    ret.height=38;
    // await this.ctx.render('index.html', { message: 'Hello, world!' });
    this.ctx.body = {
        code:200,
        captchaEnabled:true,
        img:ret.image,
        msg:'操作成功'
    }
  }
}

module.exports = HomeController;
