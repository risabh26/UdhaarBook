"use strict";

/* =====================================================
   DATA
===================================================== */

let friends =
    JSON.parse(localStorage.getItem("udhaar_friends")) || [];

let debts =
    JSON.parse(localStorage.getItem("udhaar_debts")) || [];

let transactions =
    JSON.parse(localStorage.getItem("udhaar_transactions")) || [];


let selectedFriend = null;
let selectedType = null;
let selectedDebt = null;
let currentFriend = null;


/* =====================================================
   SAVE DATA
===================================================== */

function saveData() {

    localStorage.setItem(
        "udhaar_friends",
        JSON.stringify(friends)
    );

    localStorage.setItem(
        "udhaar_debts",
        JSON.stringify(debts)
    );

    localStorage.setItem(
        "udhaar_transactions",
        JSON.stringify(transactions)
    );
}


/* =====================================================
   PAGE NAVIGATION
===================================================== */

function showPage(pageId) {

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });


    const page =
        document.getElementById(pageId);

    if (!page) return;


    page.classList.add("active");


    /*
       Bottom navigation
       Friend History doesn't have its own
       bottom navigation button.
    */

    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.remove("active");
    });


    const nav =
        document.querySelector(
            `.nav-item[data-page="${pageId}"]`
        );


    if (nav) {
        nav.classList.add("active");
    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =====================================================
   MODALS
===================================================== */

function openModal(id) {

    const modal =
        document.getElementById(id);

    if (modal) {
        modal.classList.add("show");
    }
}


function closeModal(id) {

    const modal =
        document.getElementById(id);

    if (modal) {
        modal.classList.remove("show");
    }
}


/* Close modal by clicking outside */

document.querySelectorAll(".modal").forEach(modal => {

    modal.addEventListener("click", event => {

        if (event.target === modal) {
            modal.classList.remove("show");
        }

    });

});


/* =====================================================
   FRIEND
===================================================== */

function openFriendModal() {

    document.getElementById("friendName").value = "";

    openModal("friendModal");
}


function addFriend() {

    const input =
        document.getElementById("friendName");


    const name =
        input.value.trim();


    if (!name) {

        toast("Enter friend's name");

        input.focus();

        return;
    }


    /*
       Prevent duplicate names
    */

    const exists =
        friends.some(
            friend =>
                friend.name.toLowerCase() ===
                name.toLowerCase()
        );


    if (exists) {

        toast("Friend already exists");

        return;
    }


    const friend = {

        id: Date.now(),

        name: name,

        given: 0,

        returned: 0

    };


    friends.push(friend);

    saveData();

    closeModal("friendModal");

    renderAll();

    toast("Friend added ✓");
}


/* =====================================================
   FRIEND MONEY
===================================================== */

function openMoneyModal(id, type) {

    selectedFriend = id;

    selectedType = type;


    const friend =
        friends.find(
            friend =>
                friend.id === id
        );


    if (!friend) return;


    const title =
        document.getElementById("moneyTitle");


    if (type === "give") {

        title.textContent =
            `💸 Give to ${friend.name}`;

    } else {

        title.textContent =
            `💵 Returned by ${friend.name}`;

    }


    document.getElementById("moneyAmount").value = "";

    document.getElementById("moneyNote").value = "";


    openModal("moneyModal");
}


function saveMoney() {

    const amount =
        Number(
            document.getElementById("moneyAmount")
                .value
        );


    const note =
        document.getElementById("moneyNote")
            .value.trim();


    if (!Number.isFinite(amount) || amount <= 0) {

        toast("Enter a valid amount");

        return;
    }


    const friend =
        friends.find(
            friend =>
                friend.id === selectedFriend
        );


    if (!friend) return;


    /*
       MONEY GIVEN
    */

    if (selectedType === "give") {

        friend.given += amount;

    }


    /*
       MONEY RETURNED
    */

    else {

        const remaining =
            friend.given -
            friend.returned;


        if (amount > remaining) {

            toast(
                `Maximum return is ₹${remaining
                    .toLocaleString("en-IN")}`
            );

            return;
        }


        friend.returned += amount;
    }


    /*
       Add transaction
    */

    transactions.unshift({

        id: Date.now(),

        friendId: friend.id,

        person: friend.name,

        type:
            selectedType === "give"
                ? "friend-give"
                : "friend-return",

        amount: amount,

        note: note,

        date:
            new Date()
                .toLocaleString("en-IN")

    });


    saveData();

    closeModal("moneyModal");

    renderAll();


    /*
       Refresh open friend history
    */

    if (currentFriend === friend.id) {

        renderFriendHistory(friend);

    }


    toast("Transaction saved ✓");
}


/* =====================================================
   FRIEND HISTORY
===================================================== */

function openFriendHistory(id) {

    const friend =
        friends.find(
            friend =>
                friend.id === id
        );


    if (!friend) return;


    currentFriend = id;


    renderFriendHistory(friend);


    showPage("friendHistoryPage");
}


function renderFriendHistory(friend) {

    document.getElementById("historyName")
        .textContent = friend.name;


    /*
       Balance
    */

    const balance =
        friend.given -
        friend.returned;


    const amountElement =
        document.getElementById(
            "historyAmount"
        );


    const statusElement =
        document.getElementById(
            "historyStatus"
        );


    amountElement.textContent =
        `₹${Math.abs(balance)
            .toLocaleString("en-IN")}`;


    if (balance > 0) {

        statusElement.textContent =
            "They owe you";

        statusElement.style.color =
            "#16a34a";

    }

    else if (balance < 0) {

        statusElement.textContent =
            "You owe them";

        statusElement.style.color =
            "#dc2626";

    }

    else {

        statusElement.textContent =
            "Settled";

        statusElement.style.color =
            "#777";

    }


    /*
       History buttons
    */

    document.getElementById("historyGive")
        .onclick = () => {

            openMoneyModal(
                friend.id,
                "give"
            );

        };


    document.getElementById("historyReturn")
        .onclick = () => {

            openMoneyModal(
                friend.id,
                "return"
            );

        };


    /*
       Friend transactions
    */

    const history =
        transactions.filter(
            transaction =>
                transaction.friendId ===
                friend.id
        );


    const container =
        document.getElementById(
            "friendHistoryList"
        );


    if (history.length === 0) {

        container.innerHTML = `

            <div class="empty">

                📜<br><br>

                No transactions with
                ${escapeHTML(friend.name)}
                yet.

            </div>

        `;

        return;
    }


    container.innerHTML =
        history.map(transaction => {

            const isGive =
                transaction.type ===
                "friend-give";


            return `

                <div class="transaction">

                    <div class="transaction-info">

                        <b>

                            ${
                                isGive
                                ? "💸 You gave"
                                : "💵 Returned"
                            }

                        </b>


                        <small>

                            ${
                                escapeHTML(
                                    transaction.note ||
                                    "No note"
                                )
                            }

                        </small>


                        <small>

                            ${transaction.date}

                        </small>

                    </div>


                    <div class="
                        transaction-amount
                        ${
                            isGive
                            ? "red"
                            : "green"
                        }
                    ">

                        ${
                            isGive
                            ? "+"
                            : "-"
                        }

                        ₹${transaction.amount
                            .toLocaleString("en-IN")}

                    </div>

                </div>

            `;

        }).join("");
}


/* =====================================================
   SHARE FRIEND
===================================================== */

async function shareFriend() {

    const friend =
        friends.find(
            friend =>
                friend.id === currentFriend
        );


    if (!friend) return;


    const balance =
        friend.given -
        friend.returned;


    let status;


    if (balance > 0) {

        status =
            `They owe me ₹${balance
                .toLocaleString("en-IN")}`;

    }

    else if (balance < 0) {

        status =
            `I owe them ₹${Math.abs(balance)
                .toLocaleString("en-IN")}`;

    }

    else {

        status =
            "Account is settled";

    }


    const message =

`💰 UDHAAR SUMMARY

👤 ${friend.name}

💸 Total given: ₹${friend.given
    .toLocaleString("en-IN")}

💵 Total returned: ₹${friend.returned
    .toLocaleString("en-IN")}

📌 ${status}

Generated using Udhaar.`;


    /*
       Android / supported browsers
    */

    if (navigator.share) {

        try {

            await navigator.share({

                title:
                    `Udhaar - ${friend.name}`,

                text:
                    message

            });

        }

        catch (error) {

            /*
               User cancelled share.
               Nothing needs to happen.
            */

        }

    }

    /*
       Browser without Web Share API
    */

    else {

        try {

            await navigator.clipboard
                .writeText(message);

            toast(
                "Summary copied ✓"
            );

        }

        catch (error) {

            toast(
                "Sharing not supported"
            );

        }

    }
}


/* =====================================================
   FRIEND LIST
===================================================== */

function renderFriends() {

    const container =
        document.getElementById(
            "friendsList"
        );


    const search =
        document.getElementById(
            "friendSearch"
        ).value
        .trim()
        .toLowerCase();


    const filtered =
        friends.filter(
            friend =>
                friend.name
                    .toLowerCase()
                    .includes(search)
        );


    if (filtered.length === 0) {

        container.innerHTML = `

            <div class="empty">

                👥<br><br>

                No friends found.

            </div>

        `;

        return;
    }


    container.innerHTML =
        filtered.map(friend => {

            const balance =
                friend.given -
                friend.returned;


            const status =
                balance > 0
                    ? "They owe you"
                    : "Settled";


            const statusClass =
                balance > 0
                    ? "credit"
                    : "settled";


            return `

                <div
                    class="friend-card"
                    onclick="
                        openFriendHistory(
                            ${friend.id}
                        )
                    "
                >

                    <div class="friend-top">

                        <div class="friend-name">

                            👤
                            ${escapeHTML(
                                friend.name
                            )}

                        </div>


                        <span class="
                            status
                            ${statusClass}
                        ">

                            ${status}

                        </span>

                    </div>


                    <div class="friend-info">

                        Given:

                        <b>
                            ₹${friend.given
                                .toLocaleString("en-IN")}
                        </b>

                        <br>


                        Returned:

                        <b>
                            ₹${friend.returned
                                .toLocaleString("en-IN")}
                        </b>

                        <br>


                        Remaining:

                        <b>
                            ₹${Math.max(
                                0,
                                balance
                            ).toLocaleString("en-IN")}
                        </b>

                    </div>


                    <div class="card-buttons">

                        <button
                            class="give-btn"
                            onclick="
                                event.stopPropagation();

                                openMoneyModal(
                                    ${friend.id},
                                    'give'
                                );
                            "
                        >

                            + Give

                        </button>


                        <button
                            class="return-btn"
                            onclick="
                                event.stopPropagation();

                                openMoneyModal(
                                    ${friend.id},
                                    'return'
                                );
                            "
                        >

                            + Returned

                        </button>


                        <button
                            class="delete-btn"
                            onclick="
                                event.stopPropagation();

                                deleteFriend(
                                    ${friend.id}
                                );
                            "
                        >

                            🗑️

                        </button>

                    </div>

                </div>

            `;

        }).join("");
}


/* =====================================================
   DELETE FRIEND
===================================================== */

function deleteFriend(id) {

    const friend =
        friends.find(
            friend =>
                friend.id === id
        );


    if (!friend) return;


    const confirmed =
        confirm(
            `Delete ${friend.name} and their history?`
        );


    if (!confirmed) return;


    friends =
        friends.filter(
            friend =>
                friend.id !== id
        );


    transactions =
        transactions.filter(
            transaction =>
                transaction.friendId !== id
        );


    if (currentFriend === id) {

        currentFriend = null;

        showPage("friendsPage");

    }


    saveData();

    renderAll();

    toast("Friend deleted");
}


/* =====================================================
   MY DEBT
===================================================== */

function openDebtModal() {

    document.getElementById("debtName")
        .value = "";

    document.getElementById("debtAmount")
        .value = "";

    document.getElementById("debtNote")
        .value = "";


    openModal("debtModal");
}


function addDebt() {

    const name =
        document.getElementById("debtName")
            .value.trim();


    const amount =
        Number(
            document.getElementById("debtAmount")
                .value
        );


    const note =
        document.getElementById("debtNote")
            .value.trim();


    if (!name) {

        toast(
            "Enter person or shop name"
        );

        return;
    }


    if (!Number.isFinite(amount) ||
        amount <= 0) {

        toast(
            "Enter a valid amount"
        );

        return;
    }


    const debt = {

        id: Date.now(),

        name: name,

        amount: amount,

        paid: 0,

        note: note

    };


    debts.push(debt);


    transactions.unshift({

        id: Date.now() + 1,

        person: name,

        type: "debt-add",

        amount: amount,

        note: note,

        date:
            new Date()
                .toLocaleString("en-IN")

    });


    saveData();

    closeModal("debtModal");

    renderAll();

    toast("Debt added ✓");
}


/* =====================================================
   PAY DEBT
===================================================== */

function openPaymentModal(id) {

    selectedDebt = id;


    const debt =
        debts.find(
            debt =>
                debt.id === id
        );


    if (!debt) return;


    document.getElementById("paymentTitle")
        .textContent =
        `💵 Pay ${debt.name}`;


    document.getElementById("paymentAmount")
        .value = "";

    document.getElementById("paymentNote")
        .value = "";


    openModal("paymentModal");
}


function payDebt() {

    const amount =
        Number(
            document.getElementById(
                "paymentAmount"
            ).value
        );


    const note =
        document.getElementById(
            "paymentNote"
        ).value.trim();


    const debt =
        debts.find(
            debt =>
                debt.id === selectedDebt
        );


    if (!debt) return;


    const remaining =
        debt.amount -
        debt.paid;


    if (!Number.isFinite(amount) ||
        amount <= 0) {

        toast(
            "Enter a valid amount"
        );

        return;
    }


    if (amount > remaining) {

        toast(
            `Maximum payment is ₹${remaining
                .toLocaleString("en-IN")}`
        );

        return;
    }


    debt.paid += amount;


    transactions.unshift({

        id: Date.now(),

        person: debt.name,

        type: "debt-payment",

        amount: amount,

        note: note,

        date:
            new Date()
                .toLocaleString("en-IN")

    });


    saveData();

    closeModal("paymentModal");

    renderAll();

    toast("Payment saved ✓");
}


/* =====================================================
   DELETE DEBT
===================================================== */

function deleteDebt(id) {

    const confirmed =
        confirm(
            "Delete this debt?"
        );


    if (!confirmed) return;


    debts =
        debts.filter(
            debt =>
                debt.id !== id
        );


    saveData();

    renderAll();

    toast("Debt deleted");
}


/* =====================================================
   RENDER DEBTS
===================================================== */

function renderDebts() {

    const container =
        document.getElementById(
            "debtsList"
        );


    if (debts.length === 0) {

        container.innerHTML = `

            <div class="empty">

                💳<br><br>

                No debts added yet.

            </div>

        `;

        return;
    }


    container.innerHTML =
        debts.map(debt => {

            const remaining =
                debt.amount -
                debt.paid;


            const paid =
                remaining === 0;


            return `

                <div class="debt-card-item">

                    <div class="friend-top">

                        <div class="friend-name">

                            💳
                            ${escapeHTML(
                                debt.name
                            )}

                        </div>


                        <span class="
                            status
                            ${paid
                                ? "settled"
                                : "credit"}
                        ">

                            ${paid
                                ? "Paid"
                                : "You owe"}

                        </span>

                    </div>


                    <div class="friend-info">

                        Original:

                        <b>
                            ₹${debt.amount
                                .toLocaleString("en-IN")}
                        </b>

                        <br>


                        Paid:

                        <b>
                            ₹${debt.paid
                                .toLocaleString("en-IN")}
                        </b>

                        <br>


                        Remaining:

                        <b>
                            ₹${remaining
                                .toLocaleString("en-IN")}
                        </b>


                        ${
                            debt.note
                                ? `
                                    <br>
                                    Note:
                                    ${escapeHTML(
                                        debt.note
                                    )}
                                  `
                                : ""
                        }

                    </div>


                    <div class="card-buttons">

                        ${
                            paid

                            ?

                            `
                                <button
                                    class="return-btn"
                                    disabled
                                >

                                    ✓ Fully Paid

                                </button>
                            `

                            :

                            `
                                <button
                                    class="return-btn"
                                    onclick="
                                        openPaymentModal(
                                            ${debt.id}
                                        );
                                    "
                                >

                                    💵 Pay Debt

                                </button>
                            `
                        }


                        <button
                            class="delete-btn"
                            onclick="
                                deleteDebt(
                                    ${debt.id}
                                );
                            "
                        >

                            🗑️

                        </button>

                    </div>

                </div>

            `;

        }).join("");
}

/*//ALL TRANSACTIONS
===================================================== */

function renderTransactions() {

    const container =
        document.getElementById(
            "transactionsList"
        );


    if (transactions.length === 0) {

        container.innerHTML = `

            <div class="empty">

                📜<br><br>

                No transactions yet.

            </div>

        `;

        return;
    }


    container.innerHTML =
        transactions.map(transaction => {

            let title = "";
            let color = "";
            let sign = "";


            if (
                transaction.type ===
                "friend-give"
            ) {

                title =
                    `💸 Gave to ${
                        transaction.person
                    }`;

                color = "red";

                sign = "+";

            }


            else if (
                transaction.type ===
                "friend-return"
            ) {

                title =
                    `💵 Received from ${
                        transaction.person
                    }`;

                color = "green";

                sign = "-";

            }


            else if (
                transaction.type ===
                "debt-add"
            ) {

                title =
                    `💳 Debt added: ${
                        transaction.person
                    }`;

                color = "red";

                sign = "+";

            }


            else if (
                transaction.type ===
                "debt-payment"
            ) {

                title =
                    `💵 Paid debt: ${
                        transaction.person
                    }`;

                color = "green";

                sign = "-";

            }


            return `

                <div class="transaction">

                    <div class="transaction-info">

                        <b>
                            ${escapeHTML(title)}
                        </b>


                        <small>

                            ${escapeHTML(
                                transaction.note ||
                                "No note"
                            )}

                        </small>


                        <small>

                            ${transaction.date}

                        </small>

                    </div>


                    <div class="
                        transaction-amount
                        ${color}
                    ">

                        ${sign}
                        ₹${transaction.amount
                            .toLocaleString("en-IN")}

                    </div>

                </div>

            `;

        }).join("");
}


/* =====================================================
   HOME BALANCE
===================================================== */

function renderHome() {

    let credit = 0;

    let debt = 0;


    /*
       Friends owe you
    */

    friends.forEach(friend => {

        const balance =
            friend.given -
            friend.returned;


        if (balance > 0) {

            credit += balance;

        }

    });


    /*
       You owe others
    */

    debts.forEach(item => {

        debt +=
            item.amount -
            item.paid;

    });


    document.getElementById("totalCredit")
        .textContent =
        `₹${credit
            .toLocaleString("en-IN")}`;


    document.getElementById("totalDebt")
        .textContent =
        `₹${debt
            .toLocaleString("en-IN")}`;
}


/* =====================================================
   TOAST
===================================================== */

function toast(message) {

    const element =
        document.getElementById(
            "toast"
        );


    element.textContent =
        message;


    element.classList.add("show");


    clearTimeout(
        window.toastTimer
    );


    window.toastTimer =
        setTimeout(() => {

            element.classList.remove(
                "show"
            );

        }, 2000);
}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}


/* =====================================================
   RENDER EVERYTHING
===================================================== */

function renderAll() {

    renderHome();

    renderFriends();

    renderDebts();

    renderTransactions();
}


/* =====================================================
   START APP
===================================================== */

renderAll();