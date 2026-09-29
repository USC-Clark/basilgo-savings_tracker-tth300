// ========================================
// Savings Tracker - Frontend JavaScript
// ========================================


// ========================================
// Helper Functions
// ========================================

// Format numbers as money
function formatMoney(amount) {
    return Number(amount).toFixed(2);
}


// ========================================
// DASHBOARD
// ========================================

async function loadDashboard() {

    const totalSavedElement =
        document.getElementById("totalSaved");

    const savingsGoalElement =
        document.getElementById("savingsGoal");

    const remainingToGoalElement =
        document.getElementById("remainingToGoal");


    // Only run this function on the Dashboard
    if (
        !totalSavedElement ||
        !savingsGoalElement ||
        !remainingToGoalElement
    ) {
        return;
    }


    try {

        const response = await fetch("/api/dashboard");

        if (!response.ok) {
            throw new Error("Failed to load dashboard");
        }


        const data = await response.json();


        totalSavedElement.textContent =
            formatMoney(data.totalSaved);

        savingsGoalElement.textContent =
            formatMoney(data.savingsGoal);

        remainingToGoalElement.textContent =
            formatMoney(data.remainingToGoal);


    } catch (error) {

        console.error("Dashboard error:", error);

    }

}


// ========================================
// SAVINGS LOG
// ========================================

async function loadSavingsLog() {

    const tableBody =
        document.getElementById("savingsTableBody");


    // Only run this function on Savings Log page
    if (!tableBody) {
        return;
    }


    try {

        const response =
            await fetch("/api/savings");


        if (!response.ok) {
            throw new Error("Failed to load savings");
        }


        const savings =
            await response.json();


        // Clear existing rows
        tableBody.innerHTML = "";


        // Show message if there are no entries
        if (savings.length === 0) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="4">
                        No savings entries yet.
                    </td>
                </tr>
            `;

            return;
        }


        // Create a table row for every entry
        savings.forEach(entry => {

            const row =
                document.createElement("tr");


            row.innerHTML = `
                <td>${entry.date}</td>
                <td>${formatMoney(entry.amount)}</td>
                <td>${entry.note || ""}</td>
                <td>
                    <a href="savings-form.html?id=${entry.id}">
                        Edit
                    </a>

                    <button
                        type="button"
                        onclick="deleteSavings(${entry.id})">
                        Delete
                    </button>
                </td>
            `;


            tableBody.appendChild(row);

        });


    } catch (error) {

        console.error("Savings log error:", error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="4">
                    Failed to load savings entries.
                </td>
            </tr>
        `;

    }

}


// ========================================
// DELETE SAVINGS ENTRY
// ========================================

async function deleteSavings(id) {

    const confirmed =
        confirm("Are you sure you want to delete this savings entry?");


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(`/api/savings/${id}`, {
                method: "DELETE"
            });


        const data =
            await response.json();


        if (!response.ok) {

            alert(data.message || "Failed to delete entry.");

            return;

        }


        alert("Savings entry deleted successfully.");


        // Reload the table
        loadSavingsLog();


    } catch (error) {

        console.error("Delete error:", error);

        alert("Unable to delete savings entry.");

    }

}


// ========================================
// SAVINGS FORM
// ========================================

async function setupSavingsForm() {

    const form =
        document.getElementById("savingsForm");


    // Only run on the Add/Edit page
    if (!form) {
        return;
    }


    const entryId =
        document.getElementById("entryId");

    const date =
        document.getElementById("date");

    const amount =
        document.getElementById("amount");

    const note =
        document.getElementById("note");

    const formTitle =
        document.getElementById("formTitle");


    // Check URL for an ID
    const params =
        new URLSearchParams(window.location.search);

    const id =
        params.get("id");


    // ========================================
    // EDIT MODE
    // ========================================

    if (id) {

        formTitle.textContent =
            "Edit Savings Entry";


        entryId.value = id;


        try {

            const response =
                await fetch(`/api/savings/${id}`);


            if (!response.ok) {
                throw new Error("Entry not found");
            }


            const entry =
                await response.json();


            date.value =
                entry.date;

            amount.value =
                entry.amount;

            note.value =
                entry.note || "";


        } catch (error) {

            console.error("Load entry error:", error);

            alert("Unable to load savings entry.");

        }

    }


    // ========================================
    // ADD / UPDATE FORM SUBMISSION
    // ========================================

    form.addEventListener("submit", async function(event) {

        event.preventDefault();


        const savingsData = {
            date: date.value,
            amount: amount.value,
            note: note.value
        };


        try {

            let response;


            // ====================================
            // UPDATE
            // ====================================

            if (entryId.value) {

                response =
                    await fetch(
                        `/api/savings/${entryId.value}`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type": "application/json"
                            },

                            body: JSON.stringify(savingsData)
                        }
                    );

            }


            // ====================================
            // ADD
            // ====================================

            else {

                response =
                    await fetch(
                        "/api/savings",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type": "application/json"
                            },

                            body: JSON.stringify(savingsData)
                        }
                    );

            }


            const data =
                await response.json();


            if (!response.ok) {

                alert(
                    data.message ||
                    "Failed to save entry."
                );

                return;

            }


            alert(data.message);


            // Return to Savings Log
            window.location.href =
                "savings-log.html";


        } catch (error) {

            console.error("Save entry error:", error);

            alert("Unable to save savings entry.");

        }

    });

}


// ========================================
// GOALS
// ========================================

async function setupGoals() {

    const form =
        document.getElementById("goalForm");


    // Only run on Goals page
    if (!form) {
        return;
    }


    const goalAmount =
        document.getElementById("goalAmount");

    const goalCurrentTotal =
        document.getElementById("goalCurrentTotal");

    const goalTarget =
        document.getElementById("goalTarget");

    const goalPercent =
        document.getElementById("goalPercent");

    const progressFill =
        document.getElementById("progressFill");


    // ========================================
    // LOAD GOAL AND CURRENT SAVINGS
    // ========================================

    async function loadGoalData() {

        try {

            const dashboardResponse =
                await fetch("/api/dashboard");


            if (!dashboardResponse.ok) {
                throw new Error("Failed to load dashboard data");
            }


            const data =
                await dashboardResponse.json();


            // Display current total
            goalCurrentTotal.textContent =
                formatMoney(data.totalSaved);


            // Display target
            goalTarget.textContent =
                formatMoney(data.savingsGoal);


            // Display percentage
            goalPercent.textContent =
                data.progress.toFixed(2);


            // Update progress bar
            progressFill.style.width =
                `${data.progress}%`;


            // Put existing target into input
            if (data.savingsGoal > 0) {

                goalAmount.value =
                    data.savingsGoal;

            }


        } catch (error) {

            console.error("Goal loading error:", error);

        }

    }


    await loadGoalData();


    // ========================================
    // SAVE GOAL
    // ========================================

    form.addEventListener("submit", async function(event) {

        event.preventDefault();


        const targetAmount =
            Number(goalAmount.value);


        if (isNaN(targetAmount) || targetAmount < 0) {

            alert("Please enter a valid target amount.");

            return;

        }


        try {

            const response =
                await fetch(
                    "/api/goals",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            target_amount: targetAmount
                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                alert(
                    data.message ||
                    "Failed to save goal."
                );

                return;

            }


            alert(data.message);


            // Refresh goal information
            await loadGoalData();


        } catch (error) {

            console.error("Save goal error:", error);

            alert("Unable to save savings goal.");

        }

    });

}


// ========================================
// START APPLICATION
// ========================================

document.addEventListener("DOMContentLoaded", function() {

    loadDashboard();

    loadSavingsLog();

    setupSavingsForm();

    setupGoals();

});
