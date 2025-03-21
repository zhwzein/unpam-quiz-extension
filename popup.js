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
        console.log("Fetched Quiz Data:", data);

        function formatQuiz(quizData) {
            if (!quizData || !quizData.data) {
                return "Data kuis tidak tersedia.";
            }

            let result = `Jawablah Quiz ini dengan benar. contoh format 1. A. Deskripsi\n\n`;

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

        fetch(`https://node.andaraz.com/ask?query=${formattedQuiz}`, {
            method: "GET",
        })
        .then(response => response.json())
        .then(aiData => {
            console.log("AI Response:", aiData);

            chrome.storage.local.set({ quizData: aiData.result }, () => {
                chrome.storage.local.get("quizData", (result) => {
                    if (result.quizData) {
                        outputElement.textContent = typeof result.quizData === "object" ? JSON.stringify(result.quizData, null, 2) : result.quizData;
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

document.getElementById('autoAnswer').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
        alert("No active tab found");
        return;
    }

    chrome.storage.local.get("quizData", (result) => {
        if (!result.quizData) {
            alert("No quiz data available. Please fetch data first.");
            return;
        }

        const aiAnswers = parseAiAnswers(result.quizData);
        
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: selectAnswers,
            args: [aiAnswers]
        });
    });
});

function parseAiAnswers(quizData) {
    const answerMap = {};
    const lines = quizData.split("\n");

    lines.forEach(line => {
        const match = line.match(/^(\d+)\.\s([a-e])\./i);
        if (match) {
            const questionNumber = match[1];
            const answerLetter = match[2].toUpperCase();
            answerMap[questionNumber] = answerLetter;
        }
    });

    return answerMap;
}

function selectAnswers(answerMap) {
    document.querySelectorAll(".MuiPaper-root").forEach((questionDiv) => {
        const questionHeader = questionDiv.querySelector("h6.MuiTypography-subtitle1");
        if (!questionHeader) return;

        const questionNumberMatch = questionHeader.textContent.match(/SOAL\s(\d+)/i);
        if (!questionNumberMatch) return;

        const questionNumber = questionNumberMatch[1];
        const correctAnswer = answerMap[questionNumber];

        if (!correctAnswer) return;

        const choices = questionDiv.querySelectorAll(".MuiFormControlLabel-root");

        choices.forEach(choice => {
            const answerTextMatch = choice.textContent.trim().match(/^([A-E])/);
            if (answerTextMatch && answerTextMatch[1] === correctAnswer) {
                choice.querySelector("input").click();
            }
        });
    });
}


