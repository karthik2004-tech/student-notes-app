document.addEventListener('DOMContentLoaded', () => {
    // Tab Switching Logic
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons and panes
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));

            // Add active class to clicked button
            btn.classList.add('active');

            // Show corresponding tab content
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // Follow Button Toggle Logic
    const followBtn = document.getElementById('follow-btn');
    const followersCountElement = document.querySelector('.profile-stats .stat:nth-child(2) .stat-value');
    
    // Initial followers (string to mimic '12.4k' or similar, but let's keep it simple for the demo)
    let isFollowing = false;
    let baseFollowers = 12400;

    // Helper to format numbers (e.g. 12400 -> 12.4k)
    function formatNumber(num) {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return num.toString();
    }

    followBtn.addEventListener('click', () => {
        isFollowing = !isFollowing;
        
        if (isFollowing) {
            followBtn.textContent = 'Following';
            followBtn.classList.add('following');
            baseFollowers++;
        } else {
            followBtn.textContent = 'Follow';
            followBtn.classList.remove('following');
            baseFollowers--;
        }
        
        // Update the stats UI
        followersCountElement.textContent = formatNumber(baseFollowers);
    });
});
