const BaseController = require('../base.js');
//引入jwt 
const jwt = require('jsonwebtoken');
const { decrypt } = require('../jsencrypt')
const { queryLimit } = require('../../model/sqlMap')
//引入dayjs
const dayjs = require('../../model/day.js');
class UserController extends BaseController {
    //登录
    async login() {
        const { ctx, app } = this;
        const { username, password, code } = this.ctx.request.body;
        // 获取存储的session text
        const captcha = ctx.session.captcha
        // console.log(captcha,'captcha',code,'code')
        //判断验证码是否正确
        if (code != captcha) {
            return this.error({ msg: "验证码不正确" })
        }
        //查询mysql 里面有没有该字段
        const users = await app.mysql.select('user', {
            where: {
                username,
            }
        })
        if (!users.length) {
            return this.error({ msg: '用户名或密码错误' })
        }
        const decodePassword = decrypt(password)
        const user = users.find(user => {
            const pwd = user.password,
                decodePwd = decrypt(pwd)
            return decodePwd == decodePassword
        })
        // 查不到密码相同的
        if (!user) {
            return this.error({ msg: '用户名或密码错误' })
        }
        //成功的逻辑
        //用户信息加密成token
        const token = jwt.sign({
            id: user.id
        },
            app.config.jwt.security,
            {
                expiresIn: '24h'
            }
        )
        this.success({
            userInfo: user,
            token
        })
    }
    //注册
    async register() {
        const { ctx, app } = this;
        //带过来的值
        const { username, password } = ctx.request.body;
        // 开启一个事务
        const conn = await app.mysql.beginTransaction();
        try {
            const isHaveUser = await conn.get('user', {
                where: {
                    username
                }
            })
            //如果有就直接 返回有
            if (isHaveUser.id) {
                return this.error({ msg: '该用户名已存在' })
            }
            //创建时间
            const create_time = dayjs().format('YYYY-MM-DD HH:mm:ss')
            await conn.insert('user', {
                username,
                password,
                create_time,
                update_time: create_time
            })
            await conn.commit();
            //如果返回
            if (insertRet.affectedRows > 0) {
                this.success({ msg: '注册成功' })
                // insertId
            } else {
                this.error({ msg: '注册失败' })
            }
        } catch (error) {
            console.log(error, '错误');
            await conn.rollback();//回滚事务
            throw err;
        }


    }
    // 删除个人 可以批量
    async deleteUser() {
        const { ctx, app } = this;
        const { ids } = ctx.request.body;
        const result = await this.sqlMap.del(ids, 'user', app)
        if (result.affectedRows > 0) {
            return this.success()
        }
    }
    //获取用户列表
    async getUserList() {
        const { ctx, app } = this;
        let { searchName, pageNum, pageSize } = ctx.request.query;
        const query = {

        },
            pagesParams = {
                pageNum,
                pageSize
            }

        //   if(searchName){
        //     query.where.username = searchName
        //   }
        const result = await queryLimit(pagesParams, query, 'user', app)
        //返回请求
        this.success(result)
    }
    // 获取个人信息
    async getInfo() {
        const { ctx, app } = this;
        const { id } = ctx.request.query;
        const info = await this.sqlMap.queryInfoById(id, 'user', app)
        this.success({ info })
    }
    //修改用户信息
    async updateInfo() {
        const { ctx, app } = this;
        const { id, username, password } = ctx.request.body;
        if (!id) {
            return this.error({ msg: '用户id错误' })
        }
        if (!username) {
            return this.error({ msg: '用户名格式错误' })
        }
        if (!password) {
            return this.error({ msg: '密码格式错误' })
        }
        try {
            const ret = await app.mysql.update('user', {
                id,
                username,
                password
            })
            if (ret.affectedRows == 1) {
                this.success()
            }
        } catch (error) {
            console.log('updateInfo=>error=>', error)
        }
    }
};

module.exports = UserController;