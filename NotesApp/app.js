const titleInput = document.getElementById("title");
const descriptionInput = document.getElementById("description");
const saveBtn = document.getElementById("saveBtn");
const notesContainer = document.getElementById("notesContainer");

let notes = JSON.parse(localStorage.getItem("notes")) || [];
let editIndex = null;

displayNotes();

saveBtn.addEventListener("click", () => {
    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();

    if(title === "" || description === ""){
        alert("Please fill all fields");
        return;
    }

    if(editIndex === null){
        notes.push({
            title,
            description
        });
    }else{
        notes[editIndex] = {
            title,
            description
        };

        editIndex = null;
        saveBtn.textContent = "Add Note";
    }

    localStorage.setItem("notes", JSON.stringify(notes));

    titleInput.value = "";
    descriptionInput.value = "";

    displayNotes();
});

function displayNotes(){
    notesContainer.innerHTML = "";

    notes.forEach((note,index) => {

        const noteCard = document.createElement("div");
        noteCard.classList.add("note-card");

        noteCard.innerHTML = `
            <h3>${note.title}</h3>
            <p>${note.description}</p>

            <div class="actions">
                <button class="edit-btn" onclick="editNote(${index})">
                    Edit
                </button>

                <button class="delete-btn" onclick="deleteNote(${index})">
                    Delete
                </button>
            </div>
        `;

        notesContainer.appendChild(noteCard);
    });
}

function editNote(index){
    titleInput.value = notes[index].title;
    descriptionInput.value = notes[index].description;

    editIndex = index;
    saveBtn.textContent = "Update Note";
}

function deleteNote(index){

    const confirmDelete = confirm(
        "Are you sure you want to delete this note?"
    );

    if(confirmDelete){
        notes.splice(index,1);

        localStorage.setItem(
            "notes",
            JSON.stringify(notes)
        );

        displayNotes();
    }
}