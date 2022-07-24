var db = require('../config/connection');
var collections = require('../config/collections');
var objectId = require('mongodb').ObjectId

module.exports = {

    addProduct: (product, callback)=> {

        db.get().collection('product').insertOne(product).then((data)=> {                                  //callback
            callback(data.insertedId)
        })
    },
    allProducts: ()=> {
        return new Promise ( async(resolve, reject)=> {
            let products = await db.get().collection(collections.PRODUCT_COLLECTION).find().toArray()     //promise
            resolve(products)
        })
    },
    deleteProduct: (productId) => {
        return new Promise ((resolve, reject) => {
            db.get().collection(collections.PRODUCT_COLLECTION).deleteOne({_id: objectId(productId)}).then((response) => {
                resolve(response)
            })
        })
    },
    productDetails: (productId) => {
        return new Promise (async (resolve, reject) => {
            let product = await db.get().collection(collections.PRODUCT_COLLECTION).findOne({_id: objectId(productId)})
            resolve(product)
        })
    },
    updateProduct: (productDetails, productId) => {
        return new Promise ( (resolve, reject) => {
            db.get().collection(collections.PRODUCT_COLLECTION)
            .updateOne({_id: objectId(productId)},{
                
                $set:{
                    Name: productDetails.Name,
                    Category: productDetails.Category,
                    Price: productDetails.Price,
                    Description: productDetails.Description
                }
            }
            )
            .then(() => {
                resolve()
            })
        })
    }

}