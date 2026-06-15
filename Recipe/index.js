const recipes = [
{
name:"Pancakes",
category:"Breakfast",
image:"https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=800",
ingredients:["Flour","Milk","Eggs"],
instructions:"Mix ingredients and cook on a pan."
},

{
name:"Omelette",
category:"Breakfast",
image:"https://images.unsplash.com/photo-1510693206972-df098062cb71?w=800",
ingredients:["Eggs","Onion","Salt"],
instructions:"Beat eggs and cook until fluffy."
},

{
name:"French Toast",
category:"Breakfast",
image:"https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800",
ingredients:["Bread","Eggs","Milk"],
instructions:"Dip bread and toast until golden."
},

{
name:"Veg Sandwich",
category:"Lunch",
image:"https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800",
ingredients:["Bread","Cheese","Tomato"],
instructions:"Assemble and grill."
},

{
name:"Burger",
category:"Lunch",
image:"https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
ingredients:["Bun","Patty","Lettuce"],
instructions:"Assemble burger and serve."
},

{
name:"Pizza",
category:"Lunch",
image:"https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
ingredients:["Dough","Cheese","Sauce"],
instructions:"Bake until crispy."
},

{
name:"Pasta",
category:"Dinner",
image:"https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800",
ingredients:["Pasta","Cream","Garlic"],
instructions:"Cook pasta and mix with sauce."
},

{
name:"Chicken Biryani",
category:"Dinner",
image:"https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800",
ingredients:["Rice","Chicken","Spices"],
instructions:"Cook and layer rice with chicken."
},

{
name:"Fried Rice",
category:"Dinner",
image:"https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800",
ingredients:["Rice","Vegetables","Soy Sauce"],
instructions:"Stir fry everything together."
},

{
name:"Noodles",
category:"Dinner",
image:"https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=800",
ingredients:["Noodles","Vegetables"],
instructions:"Boil and stir fry."
},

{
name:"Chocolate Cake",
category:"Dessert",
image:"https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800",
ingredients:["Flour","Chocolate","Sugar"],
instructions:"Bake until soft."
},

{
name:"Ice Cream",
category:"Dessert",
image:"https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800",
ingredients:["Milk","Sugar","Cream"],
instructions:"Freeze and serve."
}
];

const recipeContainer =
document.getElementById("recipeContainer");

const searchInput =
document.getElementById("searchInput");

const categoryFilter =
document.getElementById("categoryFilter");

function displayRecipes(data){

recipeContainer.innerHTML="";

data.forEach(recipe=>{

const card=document.createElement("div");

card.classList.add("card");

card.innerHTML=`
<img src="${recipe.image}">
<div class="card-content">
<h3>${recipe.name}</h3>
<p>${recipe.category}</p>
<button onclick="showRecipe('${recipe.name}')">
View Recipe
</button>
</div>
`;

recipeContainer.appendChild(card);

});

}

function showRecipe(name){

const recipe=
recipes.find(item=>item.name===name);

document.getElementById("recipeTitle")
.innerText=recipe.name;

document.getElementById("ingredients")
.innerHTML=recipe.ingredients
.map(item=>`<li>${item}</li>`)
.join("");

document.getElementById("instructions")
.innerText=recipe.instructions;

document.getElementById("modal")
.style.display="flex";

}

document.getElementById("closeBtn")
.addEventListener("click",()=>{

document.getElementById("modal")
.style.display="none";

});

function filterRecipes(){

const search=
searchInput.value.toLowerCase();

const category=
categoryFilter.value;

const filtered=
recipes.filter(recipe=>{

const matchesSearch=
recipe.name
.toLowerCase()
.includes(search);

const matchesCategory=
category==="All" ||
recipe.category===category;

return matchesSearch &&
matchesCategory;

});

displayRecipes(filtered);

}

searchInput.addEventListener(
"input",
filterRecipes
);

categoryFilter.addEventListener(
"change",
filterRecipes
);

displayRecipes(recipes);