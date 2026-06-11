const templates = [
`Dear ${"{teacher}"},

I hope you are doing well.

I sincerely apologize regarding my ${"{category}"} in ${"{subject}"}. Due to ${"{reason}"}, I was unable to fulfill my responsibility on time.

I understand the inconvenience caused and assure you that I will take necessary steps to avoid such situations in the future.

Thank you for your understanding.

Sincerely,
${"{name}"}
`,

`Respected ${"{teacher}"},

I would like to explain that my ${"{category}"} was affected because of ${"{reason}"}.

I regret any inconvenience caused and request your kind consideration regarding this matter.

Thank you for your patience and support.

Regards,
${"{name}"}
`
];

function generateExcuse(){

    const name = document.getElementById("name").value;
    const teacher = document.getElementById("teacher").value;
    const subject = document.getElementById("subject").value;
    const category = document.getElementById("category").value;
    const reason = document.getElementById("reason").value;

    if(!name || !teacher || !subject || !reason){
        alert("Please fill all fields");
        return;
    }

    let template =
        templates[Math.floor(Math.random()*templates.length)];

    template = template
        .replaceAll("{name}", name)
        .replaceAll("{teacher}", teacher)
        .replaceAll("{subject}", subject)
        .replaceAll("{category}", category)
        .replaceAll("{reason}", reason);

    document.getElementById("result").value = template;

    let words = template.trim().split(/\s+/).length;
    document.getElementById("count").innerText =
        "Words: " + words;

    saveHistory(template);
}

function copyText(){
    let text = document.getElementById("result");

    navigator.clipboard.writeText(text.value);

    alert("Copied Successfully!");
}

function downloadText(){

    const content =
        document.getElementById("result").value;

    const blob =
        new Blob([content], {type:"text/plain"});

    const link =
        document.createElement("a");

    link.href =
        URL.createObjectURL(blob);

    link.download = "excuse-letter.txt";

    link.click();
}

function saveHistory(text){

    let history =
        JSON.parse(localStorage.getItem("excuses")) || [];

    history.push(text);

    localStorage.setItem(
        "excuses",
        JSON.stringify(history)
    );
}

document.getElementById("themeBtn")
.addEventListener("click", ()=>{

    document.body.classList.toggle("dark");

    localStorage.setItem(
        "theme",
        document.body.classList.contains("dark")
    );
});

if(localStorage.getItem("theme") === "true"){
    document.body.classList.add("dark");
}

const clearHistoryBtn = document.getElementById('clear-history-btn');
if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
        // 1. Clear LocalStorage
        localStorage.removeItem('excuses'); 
        
        // 2. Clear the UI
        const historyContainer = document.querySelector('.history-container, #history-list'); 
        if (historyContainer) {
            historyContainer.textContent = ''; 
        }
    });
}