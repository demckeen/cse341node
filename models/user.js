const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    
    address: {
        details: [{
            firstname: {
                type: String,
                required: false,
            },
            lastname: {
                type: String,
                required: false,
            },
            street: {
                type: String,
                required: false,},
            line2: {
                type: String,
                required: false,
            },
            city: {
                type: String,
                required: false,
            },
            state: {
                    type: String,
                    required: false,
                },
            zip: {
                    type: String,
                    required: false,
                }
            }]
    },
    resetToken: String,
    resetTokenExpiration: Date,
    cart: {
        items: [{
            productId: {
                type: Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            quantity: {
                type: Number,
                required: true
            }
        }]
    }
});

userSchema.methods.addToCart = function (product, quantity) {
    console.log(quantity);
    if(parseInt(quantity) === 0) {
        return;
    }
    else {
    const cartProductIndex = this.cart.items.findIndex(cp => {
        return cp.productId.toString() === product._id.toString();
    });
    let newQuantity = quantity;
    const updatedCartItems = [...this.cart.items];

    if (cartProductIndex >= 0) {
        newQuantity = parseInt(this.cart.items[cartProductIndex].quantity) + parseInt(newQuantity);
        updatedCartItems[cartProductIndex].quantity = newQuantity;
    } else {
        updatedCartItems.push({
            productId: product._id,
            quantity: newQuantity
        });
    }
    const updatedCart = {
        items: updatedCartItems
    };
    this.cart = updatedCart;
    return this.save();}

}

userSchema.methods.deleteOneFromCart = function(productId) {
    const deleteItem = this.cart.items.filter(item => {
        return item.productId.toString() === productId.toString();
    });
    console.log(deleteItem[0].quantity);
    if(deleteItem[0].quantity > 1) {
        deleteItem[0].quantity = deleteItem[0].quantity - 1;
        return this.save();
    }
    else {
        const updatedCartItems = this.cart.items.filter(item => {
            return item.productId.toString() !== productId.toString();
        });
        this.cart.items = updatedCartItems;
        return this.save();
    }
}

userSchema.methods.addOneToCart = function(productId) {
    const addItem = this.cart.items.filter(item => {
        return item.productId.toString() === productId.toString();
    });
    console.log(addItem[0].quantity);
    addItem[0].quantity = addItem[0].quantity +1;
        return this.save();
}

userSchema.methods.removeFromCart = function(productId) {
    const updatedCartItems = this.cart.items.filter(item => {
        return item.productId.toString() !== productId.toString();
    });
    this.cart.items = updatedCartItems;
    return this.save();
}

userSchema.methods.clearCart = function() {
    this.cart = {items: []};
    return this.save();
}

module.exports = mongoose.model('User', userSchema);

// userSchema.methods.getCart() = function() {
//     const productIds = this.cart.items.map(i => {
//         return i.productId;
//     });
//     return db
//         .collection('products')
//         .find({ _id: { $in: productIds } })
//         .toArray()
//         .then(products => {
//         return products.map(p => {
//             return {
//             ...p,
//             quantity: this.cart.items.find(i => {
//                 return i.productId.toString() === p._id.toString();
//             }).quantity
//             };
//         });
//         });
// }

// const getDb = require('../util/database').getDb;

// const ObjectId = mongodb.ObjectId;

// class User {
//   constructor(username, email, cart, id) {
//     this.name = username;
//     this.email = email;
//     this.cart = cart; // {items: []}
//     this._id = id;
//   }

//   save() {
//     const db = getDb();
//     return db.collection('users').insertOne(this);
//   }

//   addToCart(product) {
//     

//   }

//   getCart() {
//     const db = getDb();
//     const productIds = this.cart.items.map(i => {
//       return i.productId;
//     });
//     return db
//       .collection('products')
//       .find({ _id: { $in: productIds } })
//       .toArray()
//       .then(products => {
//         return products.map(p => {
//           return {
//             ...p,
//             quantity: this.cart.items.find(i => {
//               return i.productId.toString() === p._id.toString();
//             }).quantity
//           };
//         });
//       });
//   }

//   deleteItemFromCart(productId) {
//     const updatedCartItems = this.cart.items.filter(item => {
//       return item.productId.toString() !== productId.toString();
//     });
//     const db = getDb();
//     return db
//       .collection('users')
//       .updateOne(
//         { _id: new ObjectId(this._id) },
//         { $set: { cart: { items: updatedCartItems } } }
//       );
//   }

//   addOrder() {
//     const db = getDb();
//     return this.getCart()
//       .then(products => {
//         const order = {
//           items: products,
//           user: {
//             _id: new ObjectId(this._id),
//             name: this.name
//           }
//         };
//         return db.collection('orders').insertOne(order);
//       })
//       .then(result => {
//         this.cart = { items: [] };
//         return db
//           .collection('users')
//           .updateOne(
//             { _id: new ObjectId(this._id) },
//             { $set: { cart: { items: [] } } }
//           );
//       });
//   }

//   getOrders() {
//     const db = getDb();
//     return db
//       .collection('orders')
//       .find({ 'user._id': new ObjectId(this._id) })
//       .toArray();
//   }

//   static findById(userId) {
//     const db = getDb();
//     return db
//       .collection('users')
//       .findOne({ _id: new ObjectId(userId) })
//       .then(user => {
//         console.log(user);
//         return user;
//       })
//       .catch(err => {
//         console.log(err);
//       });
//   }
// }

// module.exports = User;