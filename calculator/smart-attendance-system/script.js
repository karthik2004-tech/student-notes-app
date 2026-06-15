document.addEventListener('DOMContentLoaded', () => {
    
    // Set Current Date
    const dateElement = document.getElementById('current-date');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = new Date().toLocaleDateString('en-US', options);

    // Dummy Data
    let students = [
        { id: 'STU001', name: 'Alice Smith', img: '1', status: 'pending' },
        { id: 'STU002', name: 'Bob Johnson', img: '2', status: 'present' },
        { id: 'STU003', name: 'Charlie Brown', img: '3', status: 'absent' },
        { id: 'STU004', name: 'Diana Prince', img: '4', status: 'leave' },
        { id: 'STU005', name: 'Evan Wright', img: '5', status: 'present' },
        { id: 'STU006', name: 'Fiona Gallagher', img: '6', status: 'pending' },
        { id: 'STU007', name: 'George Miller', img: '7', status: 'pending' }
    ];

    const studentListEl = document.getElementById('student-list');
    const searchInput = document.getElementById('search-input');

    // DOM Elements for Stats
    const totalCount = document.getElementById('total-count');
    const presentCount = document.getElementById('present-count');
    const absentCount = document.getElementById('absent-count');
    const leaveCount = document.getElementById('leave-count');

    // Render Table
    function renderTable(data) {
        studentListEl.innerHTML = '';
        data.forEach((student, index) => {
            const tr = document.createElement('tr');
            
            // Status capitalization
            const displayStatus = student.status.charAt(0).toUpperCase() + student.status.slice(1);
            
            tr.innerHTML = `
                <td>#${student.id}</td>
                <td>
                    <div class="student-info">
                        <img src="https://i.pravatar.cc/150?img=${student.img}" alt="${student.name}" class="student-avatar">
                        ${student.name}
                    </div>
                </td>
                <td>
                    <span class="status-badge ${student.status}" id="badge-${index}">${displayStatus}</span>
                </td>
                <td>
                    <div class="action-btns">
                        <button class="mark-btn btn-present ${student.status === 'present' ? 'selected' : ''}" data-index="${index}" data-status="present" title="Mark Present"><i class="ph ph-check"></i></button>
                        <button class="mark-btn btn-absent ${student.status === 'absent' ? 'selected' : ''}" data-index="${index}" data-status="absent" title="Mark Absent"><i class="ph ph-x"></i></button>
                        <button class="mark-btn btn-leave ${student.status === 'leave' ? 'selected' : ''}" data-index="${index}" data-status="leave" title="Mark on Leave"><i class="ph ph-envelope-open"></i></button>
                    </div>
                </td>
            `;
            studentListEl.appendChild(tr);
        });

        // Add event listeners to the new buttons
        document.querySelectorAll('.mark-btn').forEach(btn => {
            btn.addEventListener('click', handleMarkAttendance);
        });

        updateStats();
    }

    // Handle Marking Attendance
    function handleMarkAttendance(e) {
        const btn = e.currentTarget;
        const index = btn.getAttribute('data-index');
        const newStatus = btn.getAttribute('data-status');

        // Update Data Model
        students[index].status = newStatus;

        // Update UI Badge
        const badge = document.getElementById(`badge-${index}`);
        badge.className = `status-badge ${newStatus}`;
        badge.textContent = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);

        // Update Button Selection States
        const siblingBtns = btn.parentElement.querySelectorAll('.mark-btn');
        siblingBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');

        updateStats();
    }

    // Update Statistics
    function updateStats() {
        let present = 0;
        let absent = 0;
        let leave = 0;

        students.forEach(s => {
            if (s.status === 'present') present++;
            if (s.status === 'absent') absent++;
            if (s.status === 'leave') leave++;
        });

        totalCount.textContent = students.length;
        presentCount.textContent = present;
        absentCount.textContent = absent;
        leaveCount.textContent = leave;
    }

    // Search Functionality
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = students.filter(s => 
            s.name.toLowerCase().includes(term) || 
            s.id.toLowerCase().includes(term)
        );
        renderTable(filtered);
    });

    // Save Button Simulation
    document.getElementById('save-btn').addEventListener('click', () => {
        const btn = document.getElementById('save-btn');
        const originalText = btn.textContent;
        btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Saving...';
        
        setTimeout(() => {
            btn.innerHTML = '<i class="ph ph-check"></i> Saved Successfully';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        }, 1000);
    });

    // Initial Render
    renderTable(students);
});
