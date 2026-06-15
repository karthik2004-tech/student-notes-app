const openDirectoryBtn = document.getElementById('openDirectoryBtn');
const newNoteBtn = document.getElementById('newNoteBtn');
const saveBtn = document.getElementById('saveBtn');
const noteList = document.getElementById('noteList');
const directoryName = document.getElementById('directoryName');
const permissionStatus = document.getElementById('permissionStatus');
const noteEditor = document.getElementById('noteEditor');
const editorTitle = document.getElementById('editorTitle');
const notePath = document.getElementById('notePath');

let currentDirectoryHandle = null;
let currentFileHandle = null;
let noteChanged = false;

openDirectoryBtn.addEventListener('click', pickDirectory);
newNoteBtn.addEventListener('click', createNewNote);
saveBtn.addEventListener('click', saveCurrentNote);
noteEditor.addEventListener('input', () => {
  noteChanged = true;
  updateSaveState();
});

window.addEventListener('beforeunload', (event) => {
  if (noteChanged) {
    event.preventDefault();
    event.returnValue = '';
  }
});

async function pickDirectory() {
  try {
    const directoryHandle = await window.showDirectoryPicker();
    currentDirectoryHandle = directoryHandle;
    await ensurePermission(currentDirectoryHandle, true);
    directoryName.textContent = directoryHandle.name;
    await refreshNotes();
  } catch (error) {
    console.error('Directory pick cancelled or failed', error);
  }
}

async function ensurePermission(handle, withWrite) {
  if (!handle) {
    permissionStatus.textContent = 'None';
    return false;
  }

  const options = { mode: withWrite ? 'readwrite' : 'read' };
  let permission = await handle.queryPermission(options);
  if (permission === 'prompt') {
    permission = await handle.requestPermission(options);
  }

  permissionStatus.textContent = permission === 'granted' ? 'Granted' : 'Denied';
  return permission === 'granted';
}

async function refreshNotes() {
  if (!currentDirectoryHandle) return;

  noteList.innerHTML = '';
  const entries = [];

  for await (const entry of currentDirectoryHandle.values()) {
    if (entry.kind === 'file' && isNoteFile(entry.name)) {
      entries.push(entry);
    }
  }

  if (entries.length === 0) {
    noteList.innerHTML = '<li class="empty-state">No notes found. Create one to sync to disk.</li>';
    clearEditor();
    return;
  }

  entries.sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    const listItem = document.createElement('li');
    const nameSpan = document.createElement('span');
    nameSpan.textContent = entry.name;
    const openButton = document.createElement('button');
    openButton.textContent = 'Open';
    openButton.addEventListener('click', () => openNote(entry));

    listItem.append(nameSpan, openButton);
    noteList.appendChild(listItem);
  }
}

function isNoteFile(name) {
  return name.endsWith('.txt') || name.endsWith('.md');
}

async function openNote(fileHandle) {
  if (!(await ensurePermission(currentDirectoryHandle, true))) {
    return;
  }

  currentFileHandle = fileHandle;
  const file = await fileHandle.getFile();
  const text = await file.text();
  noteEditor.value = text;
  noteChanged = false;
  editorTitle.textContent = fileHandle.name.replace(/\.(txt|md)$/i, '');
  notePath.textContent = fileHandle.name;
  noteEditor.disabled = false;
  updateSaveState();
}

async function createNewNote() {
  if (!currentDirectoryHandle) {
    alert('Please open a folder first.');
    return;
  }

  const baseName = `note-${Date.now()}`;
  const fileName = `${baseName}.md`;

  try {
    const handle = await currentDirectoryHandle.getFileHandle(fileName, { create: true });
    currentFileHandle = handle;
    noteEditor.value = '';
    noteChanged = false;
    editorTitle.textContent = baseName;
    notePath.textContent = fileName;
    noteEditor.disabled = false;
    updateSaveState();
    await saveCurrentNote();
    await refreshNotes();
  } catch (error) {
    console.error('Failed to create new note', error);
  }
}

async function saveCurrentNote() {
  if (!currentFileHandle) {
    return;
  }

  if (!(await ensurePermission(currentDirectoryHandle, true))) {
    alert('Write permission is required to save notes.');
    return;
  }

  try {
    const writable = await currentFileHandle.createWritable();
    await writable.write(noteEditor.value);
    await writable.close();
    noteChanged = false;
    updateSaveState();
    await refreshNotes();
  } catch (error) {
    console.error('Save failed', error);
  }
}

function updateSaveState() {
  saveBtn.disabled = !noteChanged || !currentFileHandle;
  if (noteChanged) {
    saveBtn.textContent = 'Save changes';
  } else {
    saveBtn.textContent = 'Save';
  }
}

function clearEditor() {
  currentFileHandle = null;
  noteEditor.value = '';
  noteEditor.disabled = true;
  editorTitle.textContent = 'Select a note';
  notePath.textContent = '';
  noteChanged = false;
  updateSaveState();
}
