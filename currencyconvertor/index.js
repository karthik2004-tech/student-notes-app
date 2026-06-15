const rates = {
    USD: 1,
    INR: 86,
    EUR: 0.92,
    GBP: 0.79
};

function convert() {

    const amount = Number(document.getElementById("amount").value);

    const from = document.getElementById("from").value;

    const to = document.getElementById("to").value;

    const usdAmount = amount / rates[from];

    const convertedAmount = usdAmount * rates[to];

    document.getElementById("result").innerText =
        `${amount} ${from} = ${convertedAmount.toFixed(2)} ${to}`;
}