document.addEventListener('DOMContentLoaded', () => {
    // NASA Demo API Key (Rate limited, but good for demo)
    const NASA_API_KEY = 'DEMO_KEY';
    const APOD_URL = `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`;

    const apodContent = document.getElementById('apod-content');
    const apodInfo = document.getElementById('apod-info');
    const apodTitle = document.getElementById('apod-title');
    const apodDesc = document.getElementById('apod-desc');
    const apodDate = document.getElementById('apod-date');
    const apodCopyright = document.getElementById('apod-copyright');

    async function fetchAPOD() {
        try {
            const response = await fetch(APOD_URL);
            if (!response.ok) throw new Error('Failed to fetch data');
            
            const data = await response.json();
            
            // Clear loader
            apodContent.innerHTML = '';
            
            // Handle image vs video
            if (data.media_type === 'image') {
                const img = document.createElement('img');
                img.src = data.url;
                img.alt = data.title;
                img.loading = "lazy";
                apodContent.appendChild(img);
            } else if (data.media_type === 'video') {
                const iframe = document.createElement('iframe');
                iframe.src = data.url;
                iframe.allowFullscreen = true;
                apodContent.appendChild(iframe);
            }

            // Populate Info
            apodTitle.textContent = data.title;
            apodDesc.textContent = data.explanation;
            apodDate.textContent = data.date;
            
            if(data.copyright) {
                apodCopyright.textContent = `© ${data.copyright}`;
            }

            apodInfo.classList.remove('hidden');

        } catch (error) {
            console.error(error);
            apodContent.innerHTML = `<div style="color: #ef4444; padding: 2rem; text-align: center;">
                <p>Unable to reach NASA APIs. The DEMO_KEY might be rate limited.</p>
                <p>Please try again later.</p>
            </div>`;
        }
    }

    // Initialize
    fetchAPOD();
});
