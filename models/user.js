const mongoose = require('mongoose');
const Product = require('./product')
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    resetToken : String,
    resetTokenExpiration :Date,
    cart: {
        items: [
            {
                productId: { type: Schema.Types.ObjectId, required: true, ref: 'Product' },
                quantity: { type: Number, required: true }
            }
        ]
    }
});

userSchema.methods.addToCart = function (product) {
    const updatedCartItems = [...this.cart.items];
    const cartProductIndex = updatedCartItems.findIndex(cp => {
        return cp.productId.toString() === product._id.toString();
    });

    if (cartProductIndex == -1) {
        updatedCartItems.push({
            productId: product._id,
            quantity: 1
        })
    }
    else {
        updatedCartItems[cartProductIndex].quantity = updatedCartItems[cartProductIndex].quantity + 1;
    }

    const updatedCart = { items: updatedCartItems };

    this.cart = updatedCart;
    return this.save();
}

userSchema.methods.deleteProduct = function (prodId) {
    // console.log(prodId);
    const updatedCartItems = this.cart.items.filter(p => {
        return p.productId.toString() !== prodId.toString();
    })
    // console.log(updatedCartItems);
    const updatedCart = { items: updatedCartItems };

    this.cart = updatedCart;
    return this.save();
}

userSchema.methods.deleteOneProduct = function (prodId) {
    const updatedCartItems = [...this.cart.items];
    const cartProductIndex = updatedCartItems.findIndex(cp => {
        return cp.productId.toString() === prodId.toString();
    });
    const newQty = updatedCartItems[cartProductIndex].quantity - 1;
    if (newQty == 0) {
        return this.deleteProduct(prodId);
    }
    updatedCartItems[cartProductIndex].quantity = newQty;

    const updatedCart = { items: updatedCartItems };

    this.cart = updatedCart;
    return this.save();

}

userSchema.methods.clearCart = function () {
    this.cart.items = [];
    return this.save();
}

module.exports = mongoose.model('User', userSchema);