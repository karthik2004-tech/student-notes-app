const animeImages = [
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=900",
  "https://images.unsplash.com/photo-1541560052-5e137f229371?w=900",
  "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=900",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=900",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900",
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=900"
];

const img = document.getElementById("animeImg");
const btn = document.getElementById("generateBtn");

btn.addEventListener("click", () => {

    btn.innerHTML = "⏳ Generating...";

    setTimeout(() => {

        const randomIndex = Math.floor(
            Math.random() * animeImages.length
        );

        img.src = animeImages[randomIndex];

        btn.innerHTML = "🎨 Generate Anime";

    }, 700);

});