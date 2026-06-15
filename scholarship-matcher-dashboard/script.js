document.addEventListener('DOMContentLoaded', () => {

    // --- Mock Database ---
    const mockData = [
        { id: 's1', type: 'Scholarship', title: 'Global Tech Excellence Award', org: 'Tech Foundation', field: 'Computer Science', minGpa: 3.5, amount: '$5,000', deadline: '2027-10-15' },
        { id: 's2', type: 'Scholarship', title: 'Women in Engineering Grant', org: 'Society of Women Engineers', field: 'Engineering', minGpa: 3.2, amount: '$3,000', deadline: '2027-11-01' },
        { id: 's3', type: 'Scholarship', title: 'Future Business Leaders', org: 'Commerce Corp', field: 'Business', minGpa: 3.0, amount: '$2,500', deadline: '2027-09-30' },
        { id: 'i1', type: 'Internship', title: 'Software Engineering Intern', org: 'TechNova', field: 'Computer Science', minGpa: 3.0, amount: '$40/hr', deadline: '2027-12-01' },
        { id: 'i2', type: 'Internship', title: 'Data Science Summer Intern', org: 'DataGenix', field: 'Science', minGpa: 3.4, amount: '$35/hr', deadline: '2027-11-15' },
        { id: 'i3', type: 'Internship', title: 'Marketing Coordinator', org: 'Brandify', field: 'Business', minGpa: 2.8, amount: '$25/hr', deadline: '2027-10-20' },
        { id: 's4', type: 'Scholarship', title: 'Arts & Humanities Fellowship', org: 'Creative Council', field: 'Arts', minGpa: 3.6, amount: '$4,000', deadline: '2027-10-05' },
        { id: 'i4', type: 'Internship', title: 'Mechanical Design Intern', org: 'AutoBuild', field: 'Engineering', minGpa: 3.2, amount: '$30/hr', deadline: '2027-08-30' }
    ];

    // --- State Management (LocalStorage) ---
    // kanbanState will look like: { 's1': 'Saved', 'i1': 'Applied' }
    let kanbanState = JSON.parse(localStorage.getItem('scholarshipMatcherState')) || {};

    // --- DOM Elements ---
    
    // Tabs
    const navTabs = document.querySelectorAll('.nav-tab');
    const viewSections = document.querySelectorAll('.view-section');

    // Filters
    const filterGpa = document.getElementById('filter-gpa');
    const filterField = document.getElementById('filter-field');
    const filterType = document.getElementById('filter-type');
    const btnApplyFilters = document.getElementById('btn-apply-filters');
    const resultsCount = document.getElementById('results-count');
    const oppGrid = document.getElementById('opportunities-grid');

    // Kanban Lanes
    const lanes = document.querySelectorAll('.kanban-lane');
    const laneSaved = document.getElementById('lane-saved');
    const laneApplied = document.getElementById('lane-applied');
    const laneInterviewing = document.getElementById('lane-interviewing');
    const laneAccepted = document.getElementById('lane-accepted');
    const btnClearData = document.getElementById('btn-clear-data');

    // --- 1. Tab Navigation Logic ---
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active button
            navTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Switch views
            const targetView = tab.getAttribute('data-tab');
            viewSections.forEach(v => v.style.display = 'none');
            document.getElementById(`view-${targetView}`).style.display = targetView === 'finder' ? 'grid' : 'block';

            if (targetView === 'kanban') renderKanbanBoard();
        });
    });

    // --- 2. Finder / Matching Engine Logic ---

    function filterOpportunities() {
        const userGpa = parseFloat(filterGpa.value) || 0;
        const userField = filterField.value;
        const userType = filterType.value;

        const matches = mockData.filter(item => {
            const matchGpa = userGpa >= item.minGpa;
            const matchField = userField === 'All' || item.field === userField;
            const matchType = userType === 'All' || item.type === userType;
            return matchGpa && matchField && matchType;
        });

        renderGrid(matches);
    }

    function renderGrid(data) {
        oppGrid.innerHTML = '';
        resultsCount.textContent = data.length;

        data.forEach(item => {
            const isSaved = !!kanbanState[item.id];

            const card = document.createElement('div');
            card.className = 'opp-card';
            
            card.innerHTML = `
                <div>
                    <span class="opp-type ${item.type.toLowerCase()}">${item.type}</span>
                    <h3>${item.title}</h3>
                    <div class="opp-org">${item.org}</div>
                </div>
                <div class="opp-details">
                    <span><i class="fas fa-money-bill-wave"></i> ${item.amount}</span>
                    <span class="opp-gpa">Min GPA: ${item.minGpa}</span>
                </div>
                <button class="btn-save ${isSaved ? 'saved' : ''}" data-id="${item.id}">
                    ${isSaved ? '<i class="fas fa-check"></i> Saved to Kanban' : '<i class="fas fa-bookmark"></i> Save Opportunity'}
                </button>
            `;

            // Save functionality
            const saveBtn = card.querySelector('.btn-save');
            saveBtn.addEventListener('click', () => {
                if (!kanbanState[item.id]) {
                    kanbanState[item.id] = 'Saved';
                    saveState();
                    saveBtn.classList.add('saved');
                    saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved to Kanban';
                }
            });

            oppGrid.appendChild(card);
        });
    }

    btnApplyFilters.addEventListener('click', filterOpportunities);
    
    // Initial Render
    filterOpportunities();

    // --- 3. Kanban Drag and Drop Logic ---

    function saveState() {
        localStorage.setItem('scholarshipMatcherState', JSON.stringify(kanbanState));
    }

    btnClearData.addEventListener('click', () => {
        if(confirm("Are you sure you want to reset all saved applications?")) {
            kanbanState = {};
            saveState();
            renderKanbanBoard();
            filterOpportunities(); // Update buttons on finder view
        }
    });

    function renderKanbanBoard() {
        // Clear lanes
        laneSaved.innerHTML = '';
        laneApplied.innerHTML = '';
        laneInterviewing.innerHTML = '';
        laneAccepted.innerHTML = '';

        // Populate lanes based on state
        Object.keys(kanbanState).forEach(itemId => {
            const status = kanbanState[itemId];
            const itemData = mockData.find(d => d.id === itemId);
            
            if (!itemData) return; // Cleanup orphaned IDs

            const card = document.createElement('div');
            card.className = 'kanban-card';
            card.setAttribute('draggable', true);
            card.setAttribute('data-id', itemId);

            // Format Deadline
            const daysLeft = Math.ceil((new Date(itemData.deadline) - new Date()) / (1000 * 60 * 60 * 24));
            let deadlineText = `Due: ${itemData.deadline}`;
            if (status === 'Saved' && daysLeft > 0 && daysLeft <= 365) {
                deadlineText = `Due in ${daysLeft} days!`;
            } else if (status !== 'Saved') {
                deadlineText = `Deadline: ${itemData.deadline}`;
            }

            card.innerHTML = `
                <h4>${itemData.title}</h4>
                <div class="org">${itemData.org}</div>
                <div class="deadline"><i class="fas fa-clock"></i> ${deadlineText}</div>
            `;

            // Drag Events
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', itemId);
                setTimeout(() => card.style.opacity = '0.5', 0);
            });

            card.addEventListener('dragend', () => {
                card.style.opacity = '1';
            });

            // Append to appropriate lane
            if (status === 'Saved') laneSaved.appendChild(card);
            else if (status === 'Applied') laneApplied.appendChild(card);
            else if (status === 'Interviewing') laneInterviewing.appendChild(card);
            else if (status === 'Accepted') laneAccepted.appendChild(card);
        });
    }

    // Drag over lanes
    lanes.forEach(lane => {
        const laneBody = lane.querySelector('.lane-body');

        lane.addEventListener('dragover', (e) => {
            e.preventDefault(); // allow drop
            laneBody.classList.add('drag-over');
        });

        lane.addEventListener('dragleave', () => {
            laneBody.classList.remove('drag-over');
        });

        lane.addEventListener('drop', (e) => {
            e.preventDefault();
            laneBody.classList.remove('drag-over');
            
            const itemId = e.dataTransfer.getData('text/plain');
            const newStatus = lane.getAttribute('data-status');
            
            if (itemId && kanbanState[itemId]) {
                kanbanState[itemId] = newStatus;
                saveState();
                renderKanbanBoard(); // Re-render to show updated position and logic
            }
        });
    });

});
