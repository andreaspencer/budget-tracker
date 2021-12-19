const indexedDB =
window.indexedDB ||
window.mozIndexDB ||
window.webkitIndexDB ||
window.msIndexedDB ||
window.shimIndexedDB;

let db;
const request = indexedDB.open('budget-tracker', 1);

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('new_transaction', { keyPath: "id", autoIncrement: true });
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
};

request.onsuccess = function(event) {
    db = event.target.result;

    if (navigator.online) {
        uploadTransaction();
    }
};

function saveRecord(record) {
    const transaction = db.transaction('new_transaction', 'readwrite');
    const budgetObjectStore = transaction.objectStore('new_transaction');
    budgetObjectStore.add(record);
};

function uploadTransaction() {
    const transaction = db.transaction('new_transaction', 'readwrite');
    const budgetObjectStore = transaction.objectStore('new_transaction');
    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function() {
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application.json'
                }
            })
            .then((response) => response.json())
            .then(() => {
                const transaction = db.transaction('new_transaction', 'readwrite');
                const budgetObjectStore = transaction.objectStore('new_transaction');
                budgetObjectStore.clear();
            })
            .catch(err => {
                console.log(err);
            })
        }
    }
}

window.addEventListener('online', uploadTransaction);