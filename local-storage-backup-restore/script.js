/* ==========================================================================
   VaultKeeper JS Application Script
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Navigation & Tabs
  const tabButtons = document.querySelectorAll('.nav-tab');
  const tabContents = document.querySelectorAll('.tab-content');

  // Hero Stats elements
  const statKeysCount = document.getElementById('stat-keys-count');
  const statDbSize = document.getElementById('stat-db-size');
  const statLastBackup = document.getElementById('stat-last-backup');

  // Explorer Tab elements
  const searchKeys = document.getElementById('search-keys');
  const btnAddRecord = document.getElementById('btn-add-record');
  const storageRows = document.getElementById('storage-rows');
  const explorerEmpty = document.getElementById('explorer-empty');

  // Backup & Restore Tab elements
  const btnBackupDb = document.getElementById('btn-backup-db');
  const restoreDropzone = document.getElementById('restore-dropzone');
  const restoreFileInput = document.getElementById('restore-file-input');

  // Note Exporter Sandbox elements
  const noteTitle = document.getElementById('note-title');
  const noteContent = document.getElementById('note-content');
  const exportFilename = document.getElementById('export-filename');
  const documentPreview = document.getElementById('document-preview');
  const btnExportPdf = document.getElementById('btn-export-pdf');
  const btnExportMd = document.getElementById('btn-export-md');
  const btnExportTxt = document.getElementById('btn-export-txt');
  const toolbarButtons = document.querySelectorAll('.tool-btn');

  // Modal elements (Record Add/Edit)
  const modalRecord = document.getElementById('modal-record');
  const modalTitle = document.getElementById('modal-title');
  const modalKeyInput = document.getElementById('modal-key-input');
  const modalValueInput = document.getElementById('modal-value-input');
  const btnModalCancel = document.getElementById('btn-modal-cancel');
  const btnModalSave = document.getElementById('btn-modal-save');
  const btnModalCloseRecord = document.getElementById('btn-modal-close-record');

  // Modal elements (Restore Selector)
  const modalRestoreType = document.getElementById('modal-restore-type');
  const restoreOptionCards = document.querySelectorAll('.restore-option-card');
  const btnRestoreCancel = document.getElementById('btn-restore-cancel');
  const btnRestoreConfirm = document.getElementById('btn-restore-confirm');
  const btnModalCloseRestore = document.getElementById('btn-modal-close-restore');

  // State
  let editingKey = null; // null for add mode, string for edit mode
  let pendingRestoreData = null; // object containing parsed json to restore
  let selectedRestoreType = 'merge'; // 'merge' or 'overwrite'

  // Initialize
  init();

  function init() {
    setupTabNavigation();
    setupExplorerActions();
    setupBackupRestoreActions();
    setupNoteExporterSandbox();
    refreshDatabaseStats();
    renderExplorerTable();
    
    // Lucide Icons Render
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // Toast Notification
  function showToast(message, iconName = 'check-circle') {
    const toast = document.createElement('div');
    toast.className = 'toast-notice';
    toast.innerHTML = `<i data-lucide="${iconName}"></i> <span>${message}</span>`;
    document.body.appendChild(toast);
    
    if (window.lucide) {
      window.lucide.createIcons({ attrs: { class: 'lucide-icon' } }, toast);
    }
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.2s';
      setTimeout(() => toast.remove(), 200);
    }, 3000);
  }

  // Tabs navigation controller
  function setupTabNavigation() {
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(`tab-${targetTab}`).classList.add('active');
      });
    });
  }

  // Refresh Hero Stats panel counters
  function refreshDatabaseStats() {
    const keysCount = localStorage.length;
    let totalChars = 0;
    
    for (let i = 0; i < keysCount; i++) {
      const key = localStorage.key(i);
      const val = localStorage.getItem(key) || '';
      totalChars += key.length + val.length;
    }

    // JS standard is 2 bytes per char (UTF-16 encoding)
    const totalBytes = totalChars * 2;
    const totalKB = totalBytes / 1024;
    
    statKeysCount.textContent = keysCount;
    statDbSize.textContent = `${totalKB.toFixed(2)} KB`;
    
    const lastBackup = localStorage.getItem('vk_last_backup_timestamp');
    if (lastBackup) {
      statLastBackup.textContent = new Date(parseInt(lastBackup)).toLocaleDateString();
    } else {
      statLastBackup.textContent = 'Never';
    }
  }

  // Tab 1: Data Explorer Functions
  function setupExplorerActions() {
    // Search filter input
    searchKeys.addEventListener('input', renderExplorerTable);

    // Add Record Button
    btnAddRecord.addEventListener('click', () => {
      editingKey = null;
      modalTitle.textContent = 'Add Local Storage Record';
      modalKeyInput.value = '';
      modalKeyInput.removeAttribute('readonly');
      modalValueInput.value = '';
      openModal(modalRecord);
    });

    // Close Modals
    btnModalCloseRecord.addEventListener('click', () => closeModal(modalRecord));
    btnModalCancel.addEventListener('click', () => closeModal(modalRecord));
    
    btnModalCloseRestore.addEventListener('click', () => closeModal(modalRestoreType));
    btnRestoreCancel.addEventListener('click', () => closeModal(modalRestoreType));

    // Save Action Modal Button
    btnModalSave.addEventListener('click', () => {
      const key = modalKeyInput.value.trim();
      const val = modalValueInput.value.trim();

      if (!key) {
        alert('Please specify a valid storage key.');
        return;
      }

      // If adding fresh, check key collision
      if (editingKey === null && localStorage.getItem(key) !== null) {
        if (!confirm('This key already exists. Do you want to overwrite its contents?')) {
          return;
        }
      }

      localStorage.setItem(key, val);
      closeModal(modalRecord);
      showToast('Record saved successfully!', 'save');
      refreshDatabaseStats();
      renderExplorerTable();
    });
  }

  // Render Storage Grid Table rows
  function renderExplorerTable() {
    const filterText = searchKeys.value.toLowerCase();
    storageRows.innerHTML = '';
    
    const records = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      // Skip internal backup status keys
      if (key === 'vk_last_backup_timestamp') continue;
      
      const value = localStorage.getItem(key) || '';
      const sizeBytes = (key.length + value.length) * 2;
      
      if (key.toLowerCase().includes(filterText) || value.toLowerCase().includes(filterText)) {
        records.push({ key, value, sizeBytes });
      }
    }

    // Sort key list alphabetically
    records.sort((a, b) => a.key.localeCompare(b.key));

    if (records.length === 0) {
      explorerEmpty.style.display = 'flex';
      return;
    } else {
      explorerEmpty.style.display = 'none';
    }

    records.forEach(rec => {
      const tr = document.createElement('tr');
      
      // Calculate display sizes
      const sizeDisplay = rec.sizeBytes < 1024 
        ? `${rec.sizeBytes} B` 
        : `${(rec.sizeBytes / 1024).toFixed(1)} KB`;

      tr.innerHTML = `
        <td><span class="key-badge">${escapeHtml(rec.key)}</span></td>
        <td><div class="value-preview">${escapeHtml(rec.value)}</div></td>
        <td><span class="size-badge">${sizeDisplay}</span></td>
        <td class="text-right">
          <div class="actions-row">
            <button class="btn btn-secondary btn-icon btn-sm btn-edit" title="Edit Record">
              <i data-lucide="edit-2"></i>
            </button>
            <button class="btn btn-secondary btn-icon btn-sm btn-delete" title="Delete Record">
              <i data-lucide="trash-2"></i>
            </button>
            <button class="btn btn-secondary btn-icon btn-sm btn-export-single" title="Export Key Data">
              <i data-lucide="download"></i>
            </button>
          </div>
        </td>
      `;

      // Event handlers on action buttons
      tr.querySelector('.btn-edit').addEventListener('click', () => editRecord(rec.key));
      tr.querySelector('.btn-delete').addEventListener('click', () => deleteRecord(rec.key));
      tr.querySelector('.btn-export-single').addEventListener('click', () => exportSingleKey(rec.key, rec.value));

      storageRows.appendChild(tr);
    });

    if (window.lucide) {
      window.lucide.createIcons({ attrs: { class: 'lucide-icon' } }, storageRows);
    }
  }

  // Populate edit modal fields
  function editRecord(key) {
    editingKey = key;
    modalTitle.textContent = 'Edit Local Storage Record';
    modalKeyInput.value = key;
    modalKeyInput.setAttribute('readonly', 'true'); // key name is immutable in edit
    modalValueInput.value = localStorage.getItem(key) || '';
    openModal(modalRecord);
  }

  // Remove Key
  function deleteRecord(key) {
    if (confirm(`Are you sure you want to permanently delete key "${key}" from browser localStorage?`)) {
      localStorage.removeItem(key);
      showToast('Key deleted successfully', 'trash');
      refreshDatabaseStats();
      renderExplorerTable();
    }
  }

  // Export single record
  function exportSingleKey(key, value) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ key, value }, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `key_${key}_backup.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    showToast('Key exported successfully!');
  }

  // Modal openers
  function openModal(modalEl) {
    modalEl.classList.add('active');
  }
  function closeModal(modalEl) {
    modalEl.classList.remove('active');
  }

  // Tab 2: Backup & Restore Actions
  function setupBackupRestoreActions() {
    // Backup triggers
    btnBackupDb.addEventListener('click', () => {
      const backupObj = {
        app: 'VaultKeeper Backup',
        timestamp: Date.now(),
        data: {}
      };

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        backupObj.data[key] = localStorage.getItem(key);
      }

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `vaultkeeper_db_backup_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      // Save timestamp
      const ts = Date.now();
      localStorage.setItem('vk_last_backup_timestamp', ts.toString());
      
      showToast('Database backup downloaded!', 'download-cloud');
      refreshDatabaseStats();
      renderExplorerTable();
    });

    // Dropzone trigger click
    restoreDropzone.addEventListener('click', () => {
      restoreFileInput.click();
    });

    // Dropzone dragging hover states
    restoreDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      restoreDropzone.classList.add('dragover');
    });
    restoreDropzone.addEventListener('dragleave', () => {
      restoreDropzone.classList.remove('dragover');
    });
    restoreDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      restoreDropzone.classList.remove('dragover');
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileRead(files[0]);
      }
    });

    restoreFileInput.addEventListener('change', (e) => {
      const files = e.target.files;
      if (files.length > 0) {
        handleFileRead(files[0]);
      }
    });

    // Option Selector restore cards clicked
    restoreOptionCards.forEach(card => {
      card.addEventListener('click', () => {
        restoreOptionCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        selectedRestoreType = card.getAttribute('data-type');
      });
    });

    // Restore Confirm Action
    btnRestoreConfirm.addEventListener('click', () => {
      if (!pendingRestoreData) return;

      if (selectedRestoreType === 'overwrite') {
        localStorage.clear();
      }

      // Merge keys
      Object.keys(pendingRestoreData).forEach(key => {
        localStorage.setItem(key, pendingRestoreData[key]);
      });

      closeModal(modalRestoreType);
      showToast('Database restore complete!', 'upload-cloud');
      
      // reload defaults/views
      refreshDatabaseStats();
      renderExplorerTable();
      loadNoteFromStorage(); // In case notes values got updated
      
      pendingRestoreData = null;
      restoreFileInput.value = '';
    });
  }

  // Reader backup JSON
  function handleFileRead(file) {
    if (!file.name.endsWith('.json')) {
      alert('Invalid file format. Please upload a valid VaultKeeper .json backup file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const parsed = JSON.parse(e.target.result);
        
        // Validation check
        if (parsed && typeof parsed.data === 'object' && !Array.isArray(parsed.data)) {
          pendingRestoreData = parsed.data;
          // Open selector modal
          openModal(modalRestoreType);
        } else {
          alert('JSON validation failed. The backup file does not contain a valid database layout.');
        }
      } catch (err) {
        alert('Failed to parse JSON backup file structure.');
      }
    };
    reader.readAsText(file);
  }

  // Tab 3: Rich Note Exporter Sandbox
  function setupNoteExporterSandbox() {
    // Editor text formatting
    toolbarButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const cmd = btn.getAttribute('data-command');
        document.execCommand(cmd, false, null);
        noteContent.focus();
        updatePreviewSheet();
        autoSaveNote();
      });
    });

    // Live preview update triggers
    noteTitle.addEventListener('input', () => {
      const text = noteTitle.value;
      // sync export name default
      if (!exportFilename.value || exportFilename.value === exportFilename.defaultValue) {
        exportFilename.value = text.replace(/[<>:"/\\|?*]/g, '').toLowerCase().replace(/\s+/g, '_');
      }
      updatePreviewSheet();
      autoSaveNote();
    });

    noteContent.addEventListener('input', () => {
      updatePreviewSheet();
      autoSaveNote();
    });

    // Actions
    btnExportPdf.addEventListener('click', exportToPDF);
    btnExportMd.addEventListener('click', exportToMarkdown);
    btnExportTxt.addEventListener('click', exportToTxt);

    // Initial load note
    loadNoteFromStorage();
  }

  // Auto-Save Note
  function autoSaveNote() {
    localStorage.setItem('vk_sandbox_note_title', noteTitle.value);
    localStorage.setItem('vk_sandbox_note_content', noteContent.innerHTML);
    refreshDatabaseStats(); // values count/size modified
  }

  // Load Note
  function loadNoteFromStorage() {
    const savedTitle = localStorage.getItem('vk_sandbox_note_title');
    const savedContent = localStorage.getItem('vk_sandbox_note_content');
    
    if (savedTitle) noteTitle.value = savedTitle;
    if (savedContent) noteContent.innerHTML = savedContent;
    
    // Sync default filename input
    exportFilename.value = noteTitle.value.replace(/[<>:"/\\|?*]/g, '').toLowerCase().replace(/\s+/g, '_');
    updatePreviewSheet();
  }

  // Update Preview Panel
  function updatePreviewSheet() {
    const title = noteTitle.value || 'Untitled Note';
    const content = noteContent.innerHTML || '<p><em>No content...</em></p>';
    
    documentPreview.innerHTML = `
      <strong>${escapeHtml(title)}</strong>
      <hr>
      <div style="font-size: 0.75rem; color: #334155;">${content}</div>
    `;
  }

  // PDF Export
  function exportToPDF() {
    // PDF export operates directly through styling print stylesheet definitions.
    // Triggering print layout focuses specifically on editor contents.
    window.print();
    showToast('PDF export initiated! Check print popup 📄');
  }

  // Markdown Export
  function exportToMarkdown() {
    const title = noteTitle.value || 'untitled_note';
    let filename = exportFilename.value.trim() || title.replace(/[<>:"/\\|?*]/g, '').toLowerCase().replace(/\s+/g, '_');
    if (!filename.endsWith('.md')) filename += '.md';

    const rawHtml = noteContent.innerHTML;
    let markdown = `# ${title}\n\n`;

    // Extremely simple HTML to Markdown translation
    let mdContent = rawHtml
      .replace(/<div>/gi, '\n')
      .replace(/<\/div>/gi, '')
      .replace(/<p>/gi, '')
      .replace(/<\/p>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<b>(.*?)<\/b>/gi, '**$1**')
      .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<i>(.*?)<\/i>/gi, '*$1*')
      .replace(/<em>(.*?)<\/em>/gi, '*$1*')
      .replace(/<u>(.*?)<\/u>/gi, '_$1_')
      // Lists tags
      .replace(/<ol>/gi, '\n')
      .replace(/<\/ol>/gi, '\n')
      .replace(/<ul>/gi, '\n')
      .replace(/<\/ul>/gi, '\n')
      .replace(/<li>(.*?)<\/li>/gi, '- $1\n');

    markdown += mdContent.trim();
    markdown += `\n\n---\n*Exported via VaultKeeper on: ${new Date().toLocaleString()}*`;

    // Download blob trigger
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    downloadBlob(blob, filename);
    showToast('Markdown exported successfully!');
  }

  // Plain Text Export
  function exportToTxt() {
    const title = noteTitle.value || 'untitled_note';
    let filename = exportFilename.value.trim() || title.replace(/[<>:"/\\|?*]/g, '').toLowerCase().replace(/\s+/g, '_');
    if (!filename.endsWith('.txt')) filename += '.txt';

    const plainTextContent = noteContent.innerText || '';
    let textOut = `${title}\n`;
    textOut += `${'='.repeat(title.length)}\n\n`;
    textOut += plainTextContent;
    textOut += `\n\n---\nExported via VaultKeeper on: ${new Date().toLocaleString()}`;

    // Download blob trigger
    const blob = new Blob([textOut], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, filename);
    showToast('Plain text exported successfully!');
  }

  // Blob anchor helper
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // HTML escaping utility helper
  function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe.toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
