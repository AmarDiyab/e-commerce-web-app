var db = require('../config/connection');
var collections = require('../config/collections');
const { USER_COLLECTION } = require('../config/collections');
const bcrypt = require('bcrypt');
const use  = require('../app');
const objectId = require('mongodb').ObjectId;

module.exports = {

    doSignUp: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.Password = await bcrypt.hash(userData.Password, 10)
            db.get().collection(collections.USER_COLLECTION).insertOne(userData).then((data) => {
                resolve(data.insertedId)
            })
        })
    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collections.USER_COLLECTION).findOne({ Email: userData.Email })
            if (user) {
                bcrypt.compare(userData.Password, user.Password).then((status) => {
                    if (status) {
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {
                        resolve({ status: false })
                    }
                })
            } else {
                resolve({ status: false })
            }
        })
    },
    addToCart: (productId, userId) => {
         let productObj = {
             item: objectId(productId),
             quantity: 1
         }
        return new Promise ( async (resolve, reject) => {
            let userCart = await db.get().collection(collections.CART_COLLECTION).findOne({user: objectId(userId)})
            if(userCart){
                let productExist = userCart.products.findIndex(product => product.item==productId)
                console.log(productExist)
                 if(productExist!= -1){
                    db.get().collection(collections.CART_COLLECTION)
                    .updateOne({ user: objectId(userId), 'products.item': objectId(productId)},
                     {
                         $inc: { 'products.$.quantity': 1 }
                     }
                     ).then(()=>{
                         resolve()
                     })
               }else{
                db.get().collection(collections.CART_COLLECTION)
                .updateOne({ user: objectId(userId) },
                {
                    $push: { products: productObj }

                }).then(() => {
                   resolve()
                })
            }
            }else{
                let cartObj = {
                    user: objectId(userId),
                    products: [ productObj ]
                }
                db.get().collection(collections.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },
    cartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collections.CART_COLLECTION).aggregate([
                {
                    $match: { 
                        user: objectId(userId) 
                    }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collections.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'  
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: { $arrayElemAt: [ '$product',0] }
                    }
                }
             ]).toArray()
            resolve(cartItems)
        })
    },
    cartCount: (userId) => {
        return new Promise ( async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collections.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },
    productQuantity: (details) => {
        count = parseInt(details.count)
        quantity = parseInt(details.quantity)

        return new Promise ((resolve, reject) => {
            if (count == -1 && quantity == 1){
                db.get().collection(collections.CART_COLLECTION)
                .updateOne({ _id: objectId(details.cart)},
                {
                    $pull: { products: { item: objectId(details.product)} }
                }
                ).then((response) => {
                    resolve({ removeProduct: true })
                })
            }else{
            db.get().collection(collections.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
                     {
                         $inc: { 'products.$.quantity' : count }
                     }
                     ).then((response)=>{
                         resolve({ status: true })
                     })

                    }
        })
    },
    totalAmount: (userId) => {
        return new Promise( async(resolve, reject) => {
            let total = await db.get().collection(collections.CART_COLLECTION).aggregate([
                {
                    $match: { 
                        user: objectId(userId) 
                    }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collections.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'  
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: { $arrayElemAt: [ '$product', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: [ '$quantity', { $toInt: '$product.Price'} ] } }
                    }
                }
             ]).toArray()
                resolve(total[0].total)
        })
    },
    placeOrder: (order, products, total) => {
        return new Promise ( async (resolve, reject) => {
            let status = order.payment === 'COD' ? 'placed' : 'pending'
            let orderObj = {
                deliveryDetails: {
                    address: order.address,
                    pincode: order.pincode,
                    mobile: order.mobile,
                },
                userId: objectId(order.userId),
                payment: order.payment,
                products: products,
                total: total,
                date: new Date(),
                status: status
            }
            db.get().collection(collections.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collections.CART_COLLECTION).deleteOne({ user: objectId(order.userId) })
                resolve(response)
            })
        })
    },
    cartProductList: (userId) => {
        return new Promise ( async (resolve, reject) => {
            let cart = await db.get().collection(collections.CART_COLLECTION).findOne({ user: objectId(userId) })
            resolve(cart.products)
        })
    },
    userOrders: (userId) => {
        return new Promise ( async (resolve, reject) => {
            let orders = await db.get().collection(collections.ORDER_COLLECTION).find({ userId: objectId(userId) }).toArray()
            console.log(orders)
            resolve(orders)
        })
    },
    orderProducts: (orderId) => {
        return new Promise ( async (resolve, reject) => {
            let orderItems = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collections.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product:{ $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()
            resolve(orderItems)
        })
    }

}