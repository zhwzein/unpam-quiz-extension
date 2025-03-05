document.addEventListener('DOMContentLoaded', async () => {
    chrome.storage.local.get("quizData", (result) => {
        if (result.quizData) {
            document.getElementById('output').textContent = result.quizData;
        } else {
            document.getElementById('output').textContent = "Klik tombol untuk mengambil data.\n\nMade with ❤️ by @zhwzein";
        }
    });
});

document.getElementById('fetchData').addEventListener('click', async () => {
    const outputElement = document.getElementById('output');
    
    // outputElement.textContent = 'Fetching data... ⏳';

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) {
            outputElement.textContent = 'No active tab found';
            return;
        }

        const urlPattern = /^https:\/\/mentari\.unpam\.ac\.id\/(u-courses\/|.+)/;
        if (!urlPattern.test(tab.url)) {
            outputElement.textContent = 'This extension only works on Mentari UNPAM Course pages.';
            return;
        }

        const injectionResults = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => localStorage.getItem('access')
        });

        if (chrome.runtime.lastError || !injectionResults || !injectionResults[0] || !injectionResults[0].result) {
            outputElement.textContent = 'Failed to access localStorage';
            return;
        }

        const localStorageData = injectionResults[0].result;
        if (!localStorageData) {
            outputElement.textContent = 'No data found in localStorage for key "access"';
            return;
        }

        let accessData;
        try {
            accessData = JSON.parse(localStorageData);
        } catch (e) {
            outputElement.textContent = 'Error parsing token data';
            return;
        }

        if (!Array.isArray(accessData) || accessData.length === 0 || !accessData[0].token) {
            outputElement.textContent = 'Invalid token structure';
            return;
        }

        const token = accessData[0].token;
        const quizId = tab.url.split('/').pop();
        const apiUrl = `https://mentari.unpam.ac.id/api/quiz/soal/${quizId}`;

        outputElement.textContent = 'Fetching quiz data... 📖';

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        function formatQuiz(quizData) {
            if (!quizData || !quizData.data) {
                return "Data kuis tidak tersedia.";
            }
        
            let result = `Judul: ${quizData.judul}\nDurasi: ${quizData.duration} detik\n\n`;
        
            quizData.data.forEach((soal, index) => {
                result += `${index + 1}. ${soal.deskripsi.replace(/<[^>]*>/g, '')}\n\n`;
        
                if (soal.list_jawaban) {
                    const pilihan = 'abcdefghijklmnopqrstuvwxyz';
                    soal.list_jawaban.forEach((jawaban, i) => {
                        result += `${pilihan[i]}. ${jawaban.jawaban.replace(/<[^>]*>/g, '')}\n`;
                    });
                }
                result += "\n\n";
            });
            return result;
        }

        const formattedQuiz = formatQuiz(data);

        outputElement.textContent = 'Processing quiz data with AI... 🤖';

        const model = "gpt-3.5-turbo";
        const payload = JSON.stringify({
            messages: [{ role: "user", content: formattedQuiz }],
            model: model
        });

        console.log("Payload:", payload);

        fetch("https://mpzxsmlptc4kfw5qw2h6nat6iu0hvxiw.lambda-url.us-east-2.on.aws/process", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "Postify/1.0.0"
            },
            body: payload,
            mode: "cors"
        })
        .then(response => {
            console.log("Raw Response:", response);
            return response.json();
        })
        .then(data => {
            console.log("Parsed Response:", data);
            const aiResponse = data.choices[0].message.content;
            
            chrome.storage.local.set({ quizData: aiResponse }, () => {
                chrome.storage.local.get("quizData", (result) => {
                    if (result.quizData) {
                        outputElement.textContent = result.quizData;
                    }
                });
            });
        })
        .catch(error => {
            console.error("Error processing AI response:", error);
            outputElement.textContent = 'Error processing AI response: ' + error.message;
        });

    } catch (error) {
        outputElement.textContent = 'Error: ' + error.message;
    }
});
