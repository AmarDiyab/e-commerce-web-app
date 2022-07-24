const { post, checkout } = require("../../app")

function addToCart(productId) {
    $.ajax ({
        url: '/add-to-cart/'+productId,
        method: 'get',
        success: (response) => {
            if(response.status) {
                let count = $('#cart-count').html()
                count = parseInt(count)+1
                $("#cart-count").html(count)
            }
        }
    })
}

function changeQuantity(cartId, productId, userId, count) {
    let quantity = parseInt(document.getElementById(productId).innerHTML)
    count = parseInt(count)

    $.ajax ({
        url: '/change-product-quantity',
        data: {
            userId: userId,
            cart: cartId,
            product: productId,
            count: count,
            quantity: quantity
        },
        method: 'post',
        success: (response) => {
            if (response.removeProduct) {
                alert("Product removed from Cart")
                location.reload()
            }else{
                document.getElementById(productId).innerHTML = quantity + count
                document.getElementById('total').innerHTML = response.total
            }
        }
    })
}

$("#checkout-form").submit((e) => {
    e.preventDefault()
    $.ajax({
        url: '/order-page',
        method: 'post',
        data: $('#checkout-form').serialize(),
        success: (response) => {
            alert(response)
        }

    })
})
