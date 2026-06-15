const products = [
{
    id:1,
    name:"Wireless Headphones",
    price:1999,
    image:"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"
},
{
    id:2,
    name:"Smart Watch",
    price:2999,
    image:"https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500"
},
{
    id:3,
    name:"Laptop",
    price:49999,
    image:"https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500"
},
{
    id:4,
    name:"Mobile Phone",
    price:24999,
    image:"https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500"
}
];

const productContainer = document.getElementById("product-container");
const cartItems = document.getElementById("cart-items");
const totalElement = document.getElementById("total");
const cartCount = document.getElementById("cart-count");

let cart = [];

function displayProducts(){

    productContainer.innerHTML = "";

    products.forEach(product => {

        productContainer.innerHTML += `
        <div class="product">
            <img src="${product.image}">
            <div class="product-content">
                <h3>${product.name}</h3>
                <p class="price">₹${product.price}</p>

                <button onclick="addToCart(${product.id})">
                    Add To Cart
                </button>
            </div>
        </div>
        `;
    });
}

function addToCart(id){

    const product = products.find(item => item.id === id);

    cart.push(product);

    updateCart();
}

function removeFromCart(index){

    cart.splice(index,1);

    updateCart();
}

function updateCart(){

    cartItems.innerHTML = "";

    let total = 0;

    cart.forEach((item,index)=>{

        total += item.price;

        cartItems.innerHTML += `
        <div class="cart-item">
            <span>${item.name}</span>

            <span>
                ₹${item.price}
                <button class="remove-btn"
                onclick="removeFromCart(${index})">
                Remove
                </button>
            </span>
        </div>
        `;
    });

    totalElement.textContent = total;
    cartCount.textContent = cart.length;
}

displayProducts();