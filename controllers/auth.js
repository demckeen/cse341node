const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const apiKey = process.env.SENDGRID_API_KEY;
const {
    validationResult
} = require('express-validator');

const User = require('../models/user');
const {
    getEnvironmentData
} = require('worker_threads');

const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: apiKey,
    }
}));

exports.getSignup = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'Create Account',
        errorMessage: message,
        oldInput: {
            email: '',
            password: '',
            confirmPassword: ''
        },
        validationErrors: []
    })
};

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/signup', {
            path: '/signup',
            pageTitle: 'Create Account',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: email,
                password: password,
                confirmPassword: confirmPassword
            },
            validationErrors: errors.array()
        });
    }
    bcrypt
        .hash(password, 12)
        .then(hashedPassword => {
            const user = new User({
                email: email,
                password: hashedPassword,
                cart: {
                    items: []
                }
            });
            return user.save();
        })
        .then(result => {
            req.flash('success', 'Your account has been successfully created! Please login.');
            res.redirect('/login');
            return transporter.sendMail({
                to: email,
                from: 'danamckeen@gmail.com',
                subject: 'Your New Account',
                html: '<h1>You have successfully created your account!</h1>'
            })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
          });
}

exports.getLogin = (req, res, next) => {
    let errorMessage = req.flash('error');
    if (errorMessage.length > 0) {
        errorMessage = errorMessage[0];
    } else {
        errorMessage = null;
    }
    let successMessage = req.flash('success');
    if (successMessage.length > 0) {
        successMessage = successMessage[0];
    } else {
        successMessage = null;
    }
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage: errorMessage,
        successMessage: successMessage,
        oldInput: '',
        validationErrors: []
    })
}

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: errors.array()[0].msg,
            oldInput: {email: email, password: password},
            validationErrors: errors.array()
        });
    }
    User.findOne({
            email: email
        })
        .then(userDoc => {
            if (!userDoc) {
                return res.status(422).render('auth/login', {
                    path: '/login',
                    pageTitle: 'Login',
                    errorMessage: 'Account with this email does not exist, please try again with new email address.',
                    oldInput: {email: email, password: password},
                    validationErrors: [{param: 'email'}]
                });
            }
        bcrypt
        .compare(password, userDoc.password)
        .then(doMatch => {
            if (doMatch) {
                req.session.isLoggedIn = true;
                req.session.user = userDoc;
                return req.session.save((err) => {
                    console.log(err);
                    req.flash('success', 'You are now logged in!');
                    res.redirect('/');
                });
            }
            return res.status(422).render('auth/login', {
                path: '/login',
                pageTitle: 'Login',
                errorMessage: 'Invalid email or password.',
                oldInput: {email: email, password: ''},
                validationErrors: []
            });
        });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
          });
}

exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        console.log(err);
        res.redirect('/');
    });
}

exports.getReset = (req, res, next) => {
    let errorMessage = req.flash('error');
    let successMessage = req.flash('success');
    let message;
    if (errorMessage.length > 0) {
        message = errorMessage[0];
    } else if (successMessage.length > 0) {
        message = successMessage[0]
    } else {
        message = null;
    }

    res.render('auth/reset', {
        path: '/reset',
        pageTitle: 'Reset Password',
        errorMessage: message,
        successMessage: message
    })
}

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        const email = req.body.email;
        User.findOne({
                email: email
            })
            .then(user => {
                if (!user) {
                    req.flash('error', 'No account exists with that email address.');
                    return res.redirect('/reset');
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;
                return user.save();
            })
            .then(result => {
                req.flash('success', 'Your password as been reset! Please check your email.');
                res.redirect(`/reset`);
                transporter.sendMail({
                    to: email,
                    from: 'danamckeen@gmail.com',
                    subject: 'Your Password',
                    html: `
                        <p>You requested a password reset.</p>
                        <p>Click this <a href="http://nodemaxmongoose.herokuapp.com/reset/${token}" >link</a> 
                        to set a new password.</p>`
                });
            })
            .catch(err => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
              });
    });
}

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({
            resetToken: token,
            resetTokenExpiration: {
                $gt: Date.now()
            }
        })
        .then(user => {
            let errorMessage = req.flash('error');
            if (errorMessage.length > 0) {
                errorMessage = errorMessage[0];
            } else {
                errorMessage = null;
            }
            let successMessage = req.flash('success');
            if (successMessage.length > 0) {
                successMessage = successMessage[0];
            } else {
                successMessage = null;
            }
            res.render('auth/new-password', {
                path: '/new-password',
                pageTitle: 'Set Password',
                errorMessage: errorMessage,
                successMessage: successMessage,
                userId: user._id.toString(),
                passwordToken: token
            })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
          });
}

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let resetUser;

    User.findOne({
            resetToken: passwordToken,
            resetTokenExpiration: {
                $gt: Date.now()
            },
            _id: userId
        })
        .then(user => {
            resetUser = user;
            return bcrypt.hash(newPassword, 12)
        })
        .then(hashedPassword => {
            resetUser.password = hashedPassword;
            resetUser.resetToken = undefined;
            resetUser.resetTokenExpiration = undefined;
            return resetUser.save()
        })
        .then(result => {
            req.flash('success', 'Your password has been changed')
            res.redirect('/login')
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
          });
}