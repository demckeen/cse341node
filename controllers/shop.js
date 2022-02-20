const Product = require('../models/product');
const Order = require('../models/order');

exports.getProducts = (req, res, next) => {
  let cartLength = '';
  if(req.user) {cartLength = req.user.cart.items.reduce(function(a,b) {
    return parseInt(`${a}`) + parseInt(`${b.quantity}`);
  }, 0);}
  Product.find()
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products',
        cartMessage: '',
        cartLength: cartLength,
        detail: false,
        close: '',
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  let cartLength = '';
  if(req.user) {cartLength = req.user.cart.items.reduce(function(a,b) {
    return parseInt(`${a}`) + parseInt(`${b.quantity}`);
  }, 0);}
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products',
        cartMessage: '',
        cartLength: cartLength,
        detail: true,
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
  let message = req.flash('success');
    if(message.length > 0) {
        message = message[0];
    }
    else {message = null;}
  Product.find()
    .then(products => {
      let cartLength = '';
      if(req.user) {
        cartLength = req.user.cart.items.reduce(function(a,b) {
          return parseInt(`${a}`) + parseInt(`${b.quantity}`);
        }, 0);
        }
      console.log(cartLength);
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'Products',
        path: '/',
        successMessage: message,
        cartMessage: '',
        cartLength: cartLength,
        detail: false,
        close: '',
      });
    })
    .catch(err => {
      console.log(err)
      err.httpStatusCode = 500;
      return next(err);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items;
      const cartLength = req.user.cart.items.reduce(function(a,b) {
        return parseInt(`${a}`) + parseInt(`${b.quantity}`);
      }, 0);
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products,
        cartMessage: '',
        cartLength: cartLength,
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  const quantity = req.body.quantity;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product, quantity);
    })
    .then(result => {
      if(!result) {
        Product.find()
        .then(products => {
          const cartLength = req.user.cart.items.reduce(function(a,b) {
            return parseInt(`${a}`) + parseInt(`${b.quantity}`);
          }, 0);

        return res.render('shop/product-list', {
          prods: products,
          pageTitle: 'All Products',
          path: '/products',
          cartMessage: 'Cannot add quantity of zero.',
          cartLength: cartLength,
          detail: false,
          close: '',
          });
      })}
      Product.find()
      .then(products => {
        const cartLength = req.user.cart.items.reduce(function(a,b) {
          return parseInt(`${a}`) + parseInt(`${b.quantity}`);
        }, 0);
      
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products',
        cartMessage: 'This product has been added to your cart.',
        cartLength: cartLength,
        detail: false,
        close: "closeCartMessage",
        });
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
    });
};

exports.postDetailCart = (req, res, next) => {
  const prodId = req.body.productId;
  const quantity = req.body.quantity;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product, quantity);
    })
    .then(result => {
      if(!result) {
        Product.findById(prodId)
        .then(product => {
          const cartLength = req.user.cart.items.reduce(function(a,b) {
            return parseInt(`${a}`) + parseInt(`${b.quantity}`);
          }, 0);
        return res.render('shop/product-detail', {
            product: product,
            pageTitle: product.title,
            path: '/products',
            cartMessage: '',
            cartLength: cartLength,
            detail: true,
          });
      })}
      Product.findById(prodId)
      .then(product => {
        const cartLength = req.user.cart.items.reduce(function(a,b) {
          return parseInt(`${a}`) + parseInt(`${b.quantity}`);
        }, 0);
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/product-detail',
        cartMessage: 'This product has been added to your cart.',
        cartLength: cartLength,
        detail: true,
        });
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
    });
};


exports.postCartReduceQuantity = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .deleteOneFromCart(prodId)
    .then(result => {
      req.user
      .populate('cart.items.productId')
      .execPopulate()
      .then(result => {
          const products = req.user.cart.items;
          const cartLength = req.user.cart.items.reduce(function(a,b) {
            return parseInt(`${a}`) + parseInt(`${b.quantity}`);
          }, 0);
          return res.render('shop/cart', {
            path: '/cart',
            pageTitle: 'Your Cart',
            products: products,
            cartMessage: '',
            cartLength: cartLength
        })
      });
    });
}

exports.postCartIncreaseQuantity = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .addOneToCart(prodId)
    .then(result => {
      req.user
      .populate('cart.items.productId')
      .execPopulate()
      .then(result => {
          const products = req.user.cart.items;
          const cartLength = req.user.cart.items.reduce(function(a,b) {
            return parseInt(`${a}`) + parseInt(`${b.quantity}`);
          }, 0);
          return res.render('shop/cart', {
            path: '/cart',
            pageTitle: 'Your Cart',
            products: products,
            cartMessage: '',
            cartLength: cartLength
        })
      });
    });
}

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then(result => {
      req.user
      .populate('cart.items.productId')
      .execPopulate()
      .then(result => {
        const products = req.user.cart.items;
        const cartLength = req.user.cart.items.reduce(function(a,b) {
          return parseInt(`${a}`) + parseInt(`${b.quantity}`);
        }, 0);
        return res.render('shop/cart', {
          path: '/cart',
          pageTitle: 'Your Cart',
          products: products,
          cartMessage: 'This item has been removed from your cart',
          cartLength: cartLength,
        })
      })
    });
}

exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(i => {
        return {product: { ...i.productId._doc }, quantity: i.quantity }
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        products: products
      });
      return order.save();})
    .then(result => {
      return req.user.clearCart();
    })
    .then(() => {
      req.flash('success', 'Your order has been placed. You will receive a confirmation email.')
      res.redirect('/orders');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  let message = req.flash('success');
    if(message.length > 0) {
        message = message[0];
    }
    else {message = null;}
  Order.find({'user.userId': req.user._id}).then(orders => {
    const cartLength = req.user.cart.items.reduce(function(a,b) {
      return parseInt(`${a}`) + parseInt(`${b.quantity}`);
    }, 0);
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders,
        successMessage: message,
        cartLength: cartLength
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
