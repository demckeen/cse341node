const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const apiKey = process.env.SENDGRID_API_KEY;
const {
    validationResult
} = require('express-validator');

const User = require('../models/user');
const Product = require('../models/product');
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
        cartLength: '',
        oldInput: {
            email: '',
            password: '',
            confirmPassword: '',
            firstname: '',
            lastname: '',
            street: '',
            line2: '',
            city: '',
            state: '',
            zip: '',
        },
        validationErrors: []
    })
};

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const street = req.body.street;
    const line2 = req.body.line2;
    const city = req.body.city;
    let tempstate = '';
    if(!firstname) { tempstate = ''}
        else { tempstate = req.body.state};
    const state = tempstate;
    const zip = req.body.zip;


    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/signup', {
            path: '/signup',
            pageTitle: 'Create Account',
            errorMessage: errors.array()[0].msg,
            cartLength: '',
            oldInput: {
                email: email,
                password: password,
                confirmPassword: confirmPassword,
                firstname: firstname,
                lastname: lastname,
                street: street,
                line2: line2,
                city: city,
                state: state,
                zip: zip,
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
                address: {
                    details: [{
                        firstname: firstname,
                        lastname: lastname,
                        street: street,
                        line2: line2,
                        city: city,
                        state: state,
                        zip: zip
                        }],
                    },
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
        cartLength: '',
        oldInput: {},
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
            cartLength: '',
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
                    cartLength: '',
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
                cartLength: '',
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

    let cartLength = '';
    if(req.user) {cartLength = req.user.cart.items.reduce(function(a,b) {
        return parseInt(`${a}`) + parseInt(`${b.quantity}`);
      }, 0);}

    let email;
    if(req.user) {
        email = req.user.email;
    }

    res.render('auth/reset', {
        path: '/reset',
        pageTitle: 'Reset Password',
        cartLength: '',
        successMessage: successMessage,
        errorMessage: errorMessage,
        cartLength: cartLength,
        email: email,
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
                        
                        // `<p>Click this <a href="http://localhost:3000/reset/${token}" >link</a> 
                        // to set a new password.</p>`    
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
            let cartLength = '';
            
            if(req.user) { cartLength = req.user.cart.items.reduce(function(a,b) {
                return parseInt(`${a}`) + parseInt(`${b.quantity}`);
              }, 0);}
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
                cartLength: cartLength,
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

exports.getAccount = (req, res, next) => {
    const address = req.user.address.details[0];
    const customer = req.user;
    const cartLength = req.user.cart.items.reduce(function(a,b) {
        return parseInt(`${a}`) + parseInt(`${b.quantity}`);
      }, 0);
        res.render('auth/account', {
            customer: customer,
            pageTitle: 'Your Account',
            path: '/account',
            address: address,
            cartLength: cartLength,
            errorMessage: '',
            successMessage: '',
        });
}

exports.getAddAddress = (req, res, next) => {
    let cartLength = req.user.cart.items.reduce(function(a,b) {
        return parseInt(`${a}`) + parseInt(`${b.quantity}`);
      }, 0);
    res.render('auth/edit-address', {
      pageTitle: 'Add Address',
      path: '/add-address',
      editing: false,
      hasError: false,
      errorMessage: null,
      successMessage: null,
      cartLength: cartLength,
      oldInput: {},
      address: [],
      validationErrors: []
    });
  };

exports.postAddAddress = (req, res, next) => {
    const errors = validationResult(req);
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const street = req.body.street;
    const line2 = req.body.line2;
    const city = req.body.city;
    const state = req.body.state;
    const zip = req.body.zip;
    const user = req.user;
    const cartLength = req.user.cart.items.reduce(function(a,b) {
        return parseInt(`${a}`) + parseInt(`${b.quantity}`);
      }, 0);
    
    console.log(user);
      if (!errors.isEmpty()) {
          return res.status(422).render('auth/edit-address', {
              path: '/add-address',
              pageTitle: 'Add Address',
              editing: false,
              hasError: true,
              errorMessage: errors.array()[0].msg,
              cartLength: cartLength,
              oldInput: {
                firstname: firstname,
                lastname: lastname,
                street: street,
                line2: line2,
                city: city,
                state: state,
                zip: zip
              },
              validationErrors: errors.array()
          });
      }


    User.findOne({email: req.user.email})
        .then(user => {
        user.address.details[0].firstname = firstname;
        user.address.details[0].lastname = lastname;
        user.address.details[0].street = street;
        user.address.details[0].line2 = line2;
        user.address.details[0].city = city;
        user.address.details[0].state = state;
        user.address.details[0].zip = zip;
    
        return user.save()
        .then(result => {
          console.log('UPDATED ACCOUNT!');
          res.redirect('/account');
        })
});
}

exports.getEditAddress = (req, res, next) => {
    const address = req.user.address.details[0];
    const cartLength = req.user.cart.items.reduce(function(a,b) {
        return parseInt(`${a}`) + parseInt(`${b.quantity}`);
      }, 0);
    res.render('auth/edit-address', {
      pageTitle: 'Edit Address',
      path: '/edit-address',
      editing: true,
      hasError: false,
      errorMessage: null,
      successMessage: null,
      cartLength: cartLength,
      oldInput: {
        firstname: address.firstname,
        lastname: address.lastname,
        street: address.street,
        line2: address.line2,
        city: address.city,
        state: address.state,
        zip: address.zip
      },
      address: [],
      validationErrors: []
    });
  };

exports.postEditAddress = (req, res, next) => {
    const errors = validationResult(req);
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const street = req.body.street;
    const line2 = req.body.line2;
    const city = req.body.city;
    const state = req.body.state;
    const zip = req.body.zip;
    const user = req.user;
    const cartLength = req.user.cart.items.reduce(function(a,b) {
        return parseInt(`${a}`) + parseInt(`${b.quantity}`);
      }, 0);
    
    console.log(user);
      if (!errors.isEmpty()) {
          return res.status(422).render('auth/edit-address', {
              path: '/edit-address',
              pageTitle: 'Edit Address',
              editing: true,
              hasError: true,
              errorMessage: errors.array()[0].msg,
              cartLength: cartLength,
              oldInput: {
                firstname: firstname,
                lastname: lastname,
                street: street,
                line2: line2,
                city: city,
                state: state,
                zip: zip
              },
              validationErrors: errors.array()
          });
      }


    User.findOne({email: req.user.email})
        .then(user => {
        user.address.details[0].firstname = firstname;
        user.address.details[0].lastname = lastname;
        user.address.details[0].street = street;
        user.address.details[0].line2 = line2;
        user.address.details[0].city = city;
        user.address.details[0].state = state;
        user.address.details[0].zip = zip;
    
        return user.save()
        .then(result => {
          console.log('UPDATED ACCOUNT!');
          res.redirect('/account');
        })
});
}

exports.getUpdateEmail = (req, res, next) => {
    const email = req.user.email;
    const userId = req.user._id;
    const cartLength = req.user.cart.items.reduce(function(a,b) {
        return parseInt(`${a}`) + parseInt(`${b.quantity}`);
      }, 0);
    res.render('auth/update-email', {
      pageTitle: 'Update Email',
      path: '/update-email',
      editing: true,
      hasError: false,
      userId: userId,
      errorMessage: null,
      successMessage: null,
      cartLength: cartLength,
      oldInput: {
        email: email
      },
      address: [],
      validationErrors: []
    });
  };


  exports.postUpdateEmail = (req, res, next) => {
    const errors = validationResult(req);
    const newEmail = req.body.email;
    const userId = req.body.userId;
    let resetUser;

    if (!errors.isEmpty()) {
        const cartLength = req.user.cart.items.reduce(function(a,b) {
            return parseInt(`${a}`) + parseInt(`${b.quantity}`);
          }, 0);
        return res.status(422).render('auth/update-email', {
            pageTitle: 'Update Email',
            path: '/update-email',
            editing: true,
            hasError: false,
            userId: userId,
            errorMessage: errors.array()[0].msg,
            successMessage: null,
            cartLength: cartLength,
            oldInput: {
              email: newEmail
            },
            address: [],
            validationErrors: errors.array()
          });
    }

    User.findOne({_id: userId})
        .then(user => {
            resetUser = user;
            resetUser.email = newEmail;
            return resetUser.save()
        })
        .then(result => {
            req.flash('success', 'Your email has been updated!')
            res.redirect('/account')
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
          });
}
  
    // User.findOneandUpdate(filter, update, {new: true, upsert: true, rawResult: true}, 
    //     function(err, doc) {
    //     if (err) { console.log(err); 
    //         return res.send(500, {error: err});}

    //     const address = req.user.address.details[0];
    //     const customer = req.user;
    //             res.render('auth/account', {
    //                 customer: customer,
    //                 pageTitle: 'Your Account',
    //                 path: '/account',
    //                 address: address,
    //                 errorMessage: '',
    //                 successMessage: 'Successfully saved address information.',
    //             });

    // })
  
  
    
// exports.getEditAddress = (req, res, next) => {
//     User.findOne({email: req.user.email})
//         .then(user => {
//         res.render('auth/edit-address', {
//             pageTitle: 'Edit Address',
//             path: '/edit-address',
//             editing: true,
//             hasError: false,
//             errorMessage: null,
//             successMessage: null,
//             oldInput: {},
//             address: [],
//             validationErrors: []
//         });
//         })
//         .catch(err => {
//         const error = new Error(err);
//         error.httpStatusCode = 500;
//         return next(error);
//         });
// };

// exports.postEditAddress = (req, res, next) => {
//     const prodId = req.body.productId;
//     const updatedTitle = req.body.title;
//     const updatedPrice = req.body.price;
//     const updatedImageUrl = req.body.imageUrl;
//     const updatedDesc = req.body.description;

//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//         return res.status(422).render('admin/edit-product', {
//             path: '/admin/edit-product',
//             pageTitle: 'Edit Product',
//             editing: true,
//             hasError: true,
            
//             errorMessage: errors.array()[0].msg,
//             product: {
//                 title: updatedTitle,
//                 imageUrl: updatedImageUrl,
//                 description: updatedDesc,
//                 _id: prodId
//             },
//             validationErrors: errors.array()
//         });
//     }

//     Product.findById(prodId).then(product => {
//         if(product.userId.toString() !== req.user._id.toString()) {
//         return res.redirect('/');
//         }
//         product.title = updatedTitle;
//         product.price = updatedPrice;
//         product.description = updatedDesc;
//         product.imageUrl = updatedImageUrl;
//         return product.save()
//         .then(result => {
//         console.log('UPDATED PRODUCT!');
//         res.redirect('/admin/products');
//         })
//         .catch(err => {
//         const error = new Error(err);
//         error.httpStatusCode = 500;
//         return next(error);
//         });
//     })
    
// };