// Global variables for experiment setup
let experimentActive = false;
let encryptionFeatures = [];
let decryptionFeatures = [];
let encryptedMessage = "";
let model;

// Enable all inputs, canvases, and buttons
function startExperiment() { 
    // Retrieve input values
    const observerName = document.getElementById("observerName").value.trim();
    const userName = document.getElementById("userName").value.trim();
    const experimentDate = document.getElementById("experimentDate").value;
    const experimentTime = document.getElementById("experimentTime").value;
    const location = document.getElementById("location").value.trim();
    const description = document.getElementById("experimentDescription").value.trim();
    const notes = document.getElementById("experimentNotes").value.trim(); // Retrieve the note

    // Validate required fields
    if (!observerName || !userName || !experimentDate || !experimentTime || !location || !description) {
        displayMessage("startendStatusMessage", "Please fill in all required fields to start the experiment.", false);
        return;
    }

    // Activate experiment
    experimentActive = true;

    // Enable all inputs and canvases
    document.querySelectorAll("input, button, textarea, canvas").forEach((el) => {
        el.disabled = false;
    });

    // Disable the Start Experiment button
    document.querySelector("button[onclick='startExperiment()']").disabled = true;

    // Reset canvases
    clearAllEncryptionCanvases();
    clearAllDecryptionCanvases();

    // Display success message
    displayMessage(
        "startendStatusMessage",
        `Experiment started on ${experimentDate} at ${experimentTime}. Notes: ${notes || "No notes provided."}`,
        true
    );
}

function updateThicknessDisplay(stage) {
    const thicknessValue = document.getElementById(stage === 'encryption' ? 'thicknessValueEncryption' : 'thicknessValueDecryption');
    const thicknessSlider = document.getElementById(stage === 'encryption' ? 'strokeThicknessEncryption' : 'strokeThicknessDecryption');
    thicknessValue.textContent = thicknessSlider.value;
}

function toggleFeatureValues(type) {
    const containerId = type === 'encryption' ? "encryptionFeatureValues" : "decryptionFeatureValues";
    const container = document.getElementById(containerId);
    const button = event.target;

    // Toggle visibility
    if (container.style.display === "none") {
        container.style.display = "block";
        button.innerText = `Hide ${type.charAt(0).toUpperCase() + type.slice(1)} Features`;
        displayFeatureValues(type); // Display the features
    } else {
        container.style.display = "none";
        button.innerText = `Display ${type.charAt(0).toUpperCase() + type.slice(1)} Features`;
    }
}

function displayFeatureValues(type) {
    const includeStrokeLength = document.getElementById("includeStrokeLength").checked;
    const includeStrokeSpeed = document.getElementById("includeStrokeSpeed").checked;
    const includeStrokeThickness = document.getElementById("includeStrokeThickness").checked;
    const includeStrokeColor = document.getElementById("includeStrokeColor").checked;

    const features = type === 'encryption' ? encryptionFeatures : decryptionFeatures;
    const containerId = type === 'encryption' ? "encryptionFeatureValues" : "decryptionFeatureValues";

    const container = document.getElementById(containerId);
    if (!features || features.length === 0) {
        container.innerHTML = `<p style="color: red;">No ${type} features available. Please generate the key first.</p>`;
        return;
    }

    container.innerHTML = `<h4>${type.charAt(0).toUpperCase() + type.slice(1)} Features</h4>`;
    features.forEach((feature, index) => {
        container.innerHTML += `
            <p>
                Canvas ${index + 1}:
                <br> Predicted Digit: ${feature.digit || "Not Included"}
                <br> Stroke Length: ${includeStrokeLength ? (feature.strokeLength?.toFixed(2) || "N/A") : "Not Included"}
                <br> Stroke Speed: ${includeStrokeSpeed ? (feature.speed?.toFixed(2) || "N/A") : "Not Included"}
                <br> Stroke Thickness: ${includeStrokeThickness ? (feature.thickness || "N/A") : "Not Included"}
                <br> Stroke Color: ${includeStrokeColor ? (feature.color || "N/A") : "Not Included"}
            </p>
        `;
    });
}


function toggleSection(sectionId, buttonId) {
    const section = document.getElementById(sectionId);
    const button = document.querySelector(`button[onclick="toggleSection('${sectionId}', '${buttonId}')"]`);

    if (section.style.display === "none") {
        section.style.display = "block"; // Unhide the section
        button.innerText = `Hide ${sectionId === "encryptionSection" ? "Encryption Section" : "Decryption Section"}`;
    } else {
        section.style.display = "none"; // Hide the section
        button.innerText = `Show ${sectionId === "encryptionSection" ? "Encryption Section" : "Decryption Section"}`;
    }
}

function toggleGridOverlay(stage) {
    const overlays = document.querySelectorAll(`[id^="gridOverlay${stage}"]`);
    overlays.forEach((overlay) => {
        overlay.style.display = overlay.style.display === "none" ? "block" : "none";
    });
}

function createGridImage(width, height, gridSize) {
    // Create an off-screen canvas
    const offscreenCanvas = document.createElement("canvas");
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;
    const ctx = offscreenCanvas.getContext("2d");

    // Set grid properties
    ctx.strokeStyle = "#ddd"; // Light gray grid lines
    ctx.lineWidth = 1;

    // Draw vertical grid lines
    for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }

    // Draw horizontal grid lines
    for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    // Return the grid as a data URL (image)
    return offscreenCanvas.toDataURL("image/png");
}

function applyGridOverlay() {
    const encryptionCanvases = [
        document.getElementById("gridOverlayEncryption1"),
        document.getElementById("gridOverlayEncryption2"),
        document.getElementById("gridOverlayEncryption3"),
        document.getElementById("gridOverlayEncryption4"),
    ];

    const decryptionCanvases = [
        document.getElementById("gridOverlayDecryption1"),
        document.getElementById("gridOverlayDecryption2"),
        document.getElementById("gridOverlayDecryption3"),
        document.getElementById("gridOverlayDecryption4"),
    ];

    const gridWidth = 200;
    const gridHeight = 200;
    const gridSize = 20;

    const gridDataURL = createGridImage(gridWidth, gridHeight, gridSize);

    // Apply the grid image to encryption overlays
    encryptionCanvases.forEach((overlay) => {
        overlay.src = gridDataURL;
    });

    // Apply the grid image to decryption overlays
    decryptionCanvases.forEach((overlay) => {
        overlay.src = gridDataURL;
    });
}




function preprocessCanvas(canvas) {
    const scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = 28;
    scaledCanvas.height = 28;
    const scaledCtx = scaledCanvas.getContext('2d');

    // Scale down and invert colors for matching the MNIST training setup
    scaledCtx.drawImage(canvas, 0, 0, 28, 28);
    const imgData = scaledCtx.getImageData(0, 0, 28, 28);

    // Preprocess data: normalize and invert colors
    //const grayscale = [];
    //for (let i = 0; i < imgData.data.length; i += 4) {
        //const gray = imgData.data[i] / 255.0; // Normalize
       // grayscale.push(gray);
    //}
	const grayscale = [];
	for (let i = 0; i < imgData.data.length; i += 4) {
        const r = imgData.data[i];
        const g = imgData.data[i + 1];
        const b = imgData.data[i + 2];

        // Convert to grayscale and normalize
        const gray = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
        grayscale.push( gray); // Invert to match MNIST (white digit on black background)
    }

    const tensor = tf.tensor(grayscale, [1, 28, 28, 1]); // Add batch dimension
    return tensor;
}


// Fixes for missing functions: generateEncryptionKey, encryptMessage, decryptMessage, clearAllEncryptionCanvases

// Generate encryption key
async function generateEncryptionKey() {
    const includeStrokeLength = document.getElementById("includeStrokeLength").checked;
    const includeStrokeSpeed = document.getElementById("includeStrokeSpeed").checked;
    const includeStrokeThickness = document.getElementById("includeStrokeThickness").checked;
    const includeStrokeColor = document.getElementById("includeStrokeColor").checked;

    const encryptionCanvases = [
        document.getElementById("encryptionCanvas1"),
        document.getElementById("encryptionCanvas2"),
        document.getElementById("encryptionCanvas3"),
        document.getElementById("encryptionCanvas4"),
    ];

    encryptionFeatures = [];

    for (const canvas of encryptionCanvases) {
        const ctx = canvas.getContext("2d");
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const img = preprocessCanvas(canvas);

        const predictions = await model.predict(img).data();
        const predictedDigit = predictions.indexOf(Math.max(...predictions));
        img.dispose();

        // Collect selected features only
        const feature = { digit: predictedDigit };
        if (includeStrokeLength) feature.strokeLength = canvas.strokeLength || 0;
        if (includeStrokeSpeed) feature.speed = canvas.speed || 0;
        if (includeStrokeThickness) feature.thickness = parseInt(document.getElementById("strokeThicknessEncryption").value, 10);
        if (includeStrokeColor) feature.color = document.getElementById("strokeColorEncryption").value;

        encryptionFeatures.push(feature);
    }

    const digits = encryptionFeatures.map((f) => f.digit).join(", ");
    const lengths = includeStrokeLength ? encryptionFeatures.map((f) => f.strokeLength?.toFixed(2) || "N/A").join(", ") : "Not Included";
    const speeds = includeStrokeSpeed ? encryptionFeatures.map((f) => f.speed?.toFixed(2) || "N/A").join(", ") : "Not Included";

   
}



// Encrypt message
function encryptMessage() {
    if (encryptionFeatures.length === 0) {
        displayMessage("encryptionStatusMessage", "Please generate the encryption key first!", false);
        return;
    }

    const message = document.getElementById("messageToEncrypt").value.trim();
    if (!message) {
        displayMessage("encryptionStatusMessage", "Please enter a message to encrypt.", false);
        return;
    }

    // Generate encryption key from predicted digits
    const encryptionKey = encryptionFeatures.map((feature) => feature.digit).join("");

    // Encrypt the message using CryptoJS
    encryptedMessage = CryptoJS.AES.encrypt(message, encryptionKey).toString();

    document.getElementById("encryptedMessage").innerText = `Encrypted Message: ${encryptedMessage}`;
    displayMessage("encryptionStatusMessage", "Message encrypted successfully.", true);
}


function decryptMessage() {
    if (decryptionFeatures.length === 0) {
        displayMessage("decryptionStatusMessage", "Please generate the decryption key first!", false);
        return;
    }

    const encryptedMessage = document.getElementById("messageToDecrypt").value.trim();
    if (!encryptedMessage) {
        displayMessage("decryptionStatusMessage", "Please paste the encrypted message to decrypt.", false);
        return;
    }

    // Retrieve tolerance from the user input
    const tolerance = parseFloat(document.getElementById("toleranceValue").value) || 0;

    // Generate decryption key from predicted digits
    const decryptionKey = decryptionFeatures.map((feature) => feature.digit).join("");
    const encryptionKey = encryptionFeatures.map((feature) => feature.digit).join("");

    let featuresMatch = true;

    // Validate stroke length within tolerance
    if (document.getElementById("includeStrokeLength").checked) {
        for (let i = 0; i < encryptionFeatures.length; i++) {
            const lengthDiff = Math.abs(encryptionFeatures[i].strokeLength - decryptionFeatures[i].strokeLength);
            if (lengthDiff > tolerance) {
                featuresMatch = false;
                displayMessage(
                    "decryptionStatusMessage",
                    `Stroke length mismatch on canvas ${i + 1}: Difference ${lengthDiff.toFixed(2)} exceeds tolerance.`,
                    false
                );
                return; // Stop further validation if mismatch is found
            }
        }
    }

    // Validate stroke speed within tolerance
    if (document.getElementById("includeStrokeSpeed").checked) {
        for (let i = 0; i < encryptionFeatures.length; i++) {
            const speedDiff = Math.abs(encryptionFeatures[i].speed - decryptionFeatures[i].speed);
            if (speedDiff > tolerance) {
                featuresMatch = false;
                displayMessage(
                    "decryptionStatusMessage",
                    `Stroke speed mismatch on canvas ${i + 1}: Difference ${speedDiff.toFixed(2)} exceeds tolerance.`,
                    false
                );
                return;
            }
        }
    }

    // Validate stroke thickness
    if (document.getElementById("includeStrokeThickness").checked) {
        for (let i = 0; i < encryptionFeatures.length; i++) {
            if (encryptionFeatures[i].thickness !== decryptionFeatures[i].thickness) {
                featuresMatch = false;
                displayMessage(
                    "decryptionStatusMessage",
                    `Stroke thickness mismatch on canvas ${i + 1}.`,
                    false
                );
                return;
            }
        }
    }

    // Validate stroke color
    if (document.getElementById("includeStrokeColor").checked) {
        for (let i = 0; i < encryptionFeatures.length; i++) {
            if (encryptionFeatures[i].color !== decryptionFeatures[i].color) {
                featuresMatch = false;
                displayMessage(
                    "decryptionStatusMessage",
                    `Stroke color mismatch on canvas ${i + 1}.`,
                    false
                );
                return;
            }
        }
    }

    // If all features match and encryption/decryption keys match
    if (featuresMatch && encryptionKey === decryptionKey) {
        try {
            const decrypted = CryptoJS.AES.decrypt(encryptedMessage, decryptionKey).toString(CryptoJS.enc.Utf8);
            if (!decrypted) {
                throw new Error("Decryption failed");
            }
            document.getElementById("decryptedMessage").innerText = `Decrypted Message: ${decrypted}`;
            displayMessage("decryptionStatusMessage", "Message decrypted successfully.", true);
        } catch {
            displayMessage("decryptionStatusMessage", "Decryption failed due to incorrect key or features.", false);
        }
    } else {
        displayMessage(
            "decryptionStatusMessage",
            "Decryption failed. The key or features do not match.",
            false
        );
    }
}



// Clear all encryption canvases
function clearAllEncryptionCanvases() {
    const encryptionCanvases = [
        document.getElementById("encryptionCanvas1"),
        document.getElementById("encryptionCanvas2"),
        document.getElementById("encryptionCanvas3"),
        document.getElementById("encryptionCanvas4"),
    ];
    encryptionCanvases.forEach(clearCanvas);
}


// Generate decryption key
async function generateDecryptionKey() {
    const includeStrokeLength = document.getElementById("includeStrokeLength").checked;
    const includeStrokeSpeed = document.getElementById("includeStrokeSpeed").checked;
    const includeStrokeThickness = document.getElementById("includeStrokeThickness").checked;
    const includeStrokeColor = document.getElementById("includeStrokeColor").checked;

    const decryptionCanvases = [
        document.getElementById("decryptionCanvas1"),
        document.getElementById("decryptionCanvas2"),
        document.getElementById("decryptionCanvas3"),
        document.getElementById("decryptionCanvas4"),
    ];

    decryptionFeatures = [];

    for (const canvas of decryptionCanvases) {
        const ctx = canvas.getContext("2d");
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const img = preprocessCanvas(canvas);

        const predictions = await model.predict(img).data();
        const predictedDigit = predictions.indexOf(Math.max(...predictions));
        img.dispose();

        // Collect selected features only
        const feature = { digit: predictedDigit };
        if (includeStrokeLength) feature.strokeLength = canvas.strokeLength || 0;
        if (includeStrokeSpeed) feature.speed = canvas.speed || 0;
        if (includeStrokeThickness) feature.thickness = parseInt(document.getElementById("strokeThicknessDecryption").value, 10);
        if (includeStrokeColor) feature.color = document.getElementById("strokeColorDecryption").value;

        decryptionFeatures.push(feature);
    }

    const digits = decryptionFeatures.map((f) => f.digit).join(", ");
    const lengths = includeStrokeLength ? decryptionFeatures.map((f) => f.strokeLength?.toFixed(2) || "N/A").join(", ") : "Not Included";
    const speeds = includeStrokeSpeed ? decryptionFeatures.map((f) => f.speed?.toFixed(2) || "N/A").join(", ") : "Not Included";

    
}



// Clear all decryption canvases
function clearAllDecryptionCanvases() {
    const decryptionCanvases = [
        document.getElementById("decryptionCanvas1"),
        document.getElementById("decryptionCanvas2"),
        document.getElementById("decryptionCanvas3"),
        document.getElementById("decryptionCanvas4"),
    ];
    decryptionCanvases.forEach(clearCanvas);
}

// Clear a specific canvas
function clearCanvas(canvas) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "black"; // Black background
    ctx.fillRect(0, 0, canvas.width, canvas.height);


}

// Display messages on the page
function displayMessage(elementId, message, isSuccess) { 
    const element = document.getElementById(elementId);
    element.innerText = message;
    element.style.color = isSuccess ? "green" : "red";
}

async function loadPretrainedModel() {
    try {
        model = await tf.loadLayersModel('mnist-model/model.json');
        console.log("Pretrained model loaded successfully.");
    } catch (error) {
        console.error("Error loading pretrained model:", error);
    }
}


function startDrawing(ctx, canvas, e) {
    canvas.drawing = true;
    canvas.strokeLength = 0;
    canvas.startTime = Date.now();
    canvas.path = [];
    ctx.beginPath();
    draw(ctx, canvas, e);
}

function stopDrawing(ctx, canvas) {
    canvas.drawing = false;
    canvas.endTime = Date.now();
    canvas.speed = canvas.strokeLength / ((canvas.endTime - canvas.startTime) / 1000);
    ctx.beginPath();
}

function draw(ctx, canvas, e, stage) {
    if (!canvas.drawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    canvas.path.push({ x, y });

    if (canvas.lastX !== undefined && canvas.lastY !== undefined) {
        const dx = x - canvas.lastX;
        const dy = y - canvas.lastY;
        canvas.strokeLength += Math.sqrt(dx ** 2 + dy ** 2);
    }

    // Update stroke thickness and color dynamically
    const thickness = parseInt(document.getElementById(stage === "encryption" ? "strokeThicknessEncryption" : "strokeThicknessDecryption").value, 10);
    const color = document.getElementById(stage === "encryption" ? "strokeColorEncryption" : "strokeColorDecryption").value;

    ctx.lineWidth = thickness; // Apply thickness
    ctx.strokeStyle = color;   // Apply color
    ctx.lineCap = "round";

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);

    canvas.lastX = x;
    canvas.lastY = y;
	console.log(`Drawing on stage: ${stage}`);
	console.log(`Thickness: ${thickness}, Color: ${color}`);
}


function saveExperimentData() {
    const observerName = document.getElementById("observerName").value.trim();
    const userName = document.getElementById("userName").value.trim();
    const experimentDate = document.getElementById("experimentDate").value;
    const experimentTime = document.getElementById("experimentTime").value;
    const location = document.getElementById("location").value.trim();
    const description = document.getElementById("experimentDescription").value.trim();
    const notes = document.getElementById("experimentNotes").value.trim();

    // Base data for CSV
    let csvHeaders = [
        "Observer",
        "User",
        "Date",
        "Time",
        "Location",
        "Description",
        "Notes"
    ];
    let csvRows = [
        observerName,
        userName,
        experimentDate,
        experimentTime,
        location,
        description,
        notes
    ];

    // Add intended digits for encryption
    const intendedDigitsEncryption = [
        document.getElementById("intendedDigitEncryption1").value.trim() || "N/A",
        document.getElementById("intendedDigitEncryption2").value.trim() || "N/A",
        document.getElementById("intendedDigitEncryption3").value.trim() || "N/A",
        document.getElementById("intendedDigitEncryption4").value.trim() || "N/A"
    ];
    intendedDigitsEncryption.forEach((digit, index) => {
        csvHeaders.push(`EncryptionCanvas${index + 1}_IntendedDigit`);
        csvRows.push(digit);
    });

    // Add encryption features
    encryptionFeatures.forEach((feature, index) => {
        csvHeaders.push(
            `EncryptionCanvas${index + 1}_Digit`,
            `EncryptionCanvas${index + 1}_StrokeLength`,
            `EncryptionCanvas${index + 1}_StrokeSpeed`,
            `EncryptionCanvas${index + 1}_StrokeThickness`,
            `EncryptionCanvas${index + 1}_StrokeColor`
        );
        csvRows.push(
            feature.digit || "N/A",
            feature.strokeLength || "N/A",
            feature.speed || "N/A",
            feature.thickness || "N/A",
            feature.color || "N/A"
        );
    });

    // Add intended digits for decryption
    const intendedDigitsDecryption = [
        document.getElementById("intendedDigitDecryption1").value.trim() || "N/A",
        document.getElementById("intendedDigitDecryption2").value.trim() || "N/A",
        document.getElementById("intendedDigitDecryption3").value.trim() || "N/A",
        document.getElementById("intendedDigitDecryption4").value.trim() || "N/A"
    ];
    intendedDigitsDecryption.forEach((digit, index) => {
        csvHeaders.push(`DecryptionCanvas${index + 1}_IntendedDigit`);
        csvRows.push(digit);
    });

    // Add decryption features
    decryptionFeatures.forEach((feature, index) => {
        csvHeaders.push(
            `DecryptionCanvas${index + 1}_Digit`,
            `DecryptionCanvas${index + 1}_StrokeLength`,
            `DecryptionCanvas${index + 1}_StrokeSpeed`,
            `DecryptionCanvas${index + 1}_StrokeThickness`,
            `DecryptionCanvas${index + 1}_StrokeColor`
        );
        csvRows.push(
            feature.digit || "N/A",
            feature.strokeLength || "N/A",
            feature.speed || "N/A",
            feature.thickness || "N/A",
            feature.color || "N/A"
        );
    });

    // Combine headers and rows into CSV format
    const csvContent = `${csvHeaders.join(",")}\n${csvRows.map((value) => `"${value}"`).join(",")}`;

    return csvContent; // Return the CSV data as a string
}




function resetExperiment() {
    // Clear all input fields
    document.getElementById("observerName").value = "";
    document.getElementById("userName").value = "";
    document.getElementById("experimentDate").value = "";
    document.getElementById("experimentTime").value = "";
    document.getElementById("location").value = "";
    document.getElementById("experimentDescription").value = "";
    document.getElementById("experimentNotes").value = "";

    // Clear messages and feature displays
    displayMessage("encryptionStatusMessage", "", true);
    displayMessage("decryptionStatusMessage", "", true);
	displayMessage("startendStatusMessage","", true);
    document.getElementById("encryptedMessage").innerText = "Encrypted Message: None";
    document.getElementById("decryptedMessage").innerText = "Decrypted Message: None";
    document.getElementById("encryptionFeatureValues").innerText = "";
    document.getElementById("decryptionFeatureValues").innerText = "";

    // Reset canvases
    const encryptionCanvases = [
        document.getElementById("encryptionCanvas1"),
        document.getElementById("encryptionCanvas2"),
        document.getElementById("encryptionCanvas3"),
        document.getElementById("encryptionCanvas4"),
    ];
    const decryptionCanvases = [
        document.getElementById("decryptionCanvas1"),
        document.getElementById("decryptionCanvas2"),
        document.getElementById("decryptionCanvas3"),
        document.getElementById("decryptionCanvas4"),
    ];
    encryptionCanvases.forEach(clearCanvas);
    decryptionCanvases.forEach(clearCanvas);

    // Clear message text areas in encryption and decryption sections
    document.getElementById("messageToEncrypt").value = ""; // Clear encryption message
    document.getElementById("messageToDecrypt").value = ""; // Clear decryption message

    // Reset stroke thickness and color for encryption
    document.getElementById("strokeThicknessEncryption").value = 5; // Default thickness
    document.getElementById("strokeColorEncryption").value = "#ffffff"; // Default color (white)

    // Reset stroke thickness and color for decryption
    document.getElementById("strokeThicknessDecryption").value = 5; // Default thickness
    document.getElementById("strokeColorDecryption").value = "#ffffff"; // Default color (white)

    // Reset global variables
    encryptionFeatures = [];
    decryptionFeatures = [];
    encryptedMessage = null;

    console.log("Experiment reset successfully.");
}



function endExperiment() {
    if (!experimentActive) {
        displayMessage("encryptionStatusMessage", "No active experiment to end.", false);
        return;
    }

    // Save experiment data as a CSV string
    const csvData = saveExperimentData();

    // Reset the page to the initial state
    resetExperiment();
    experimentActive = false;

    // Display the CSV string on the page
    displayCSVAsString(csvData);

    displayMessage("encryptionStatusMessage", "Experiment ended and data displayed successfully.", true);
}


function displayCSVAsString(csvData) {
    const container = document.getElementById("experimentDataDisplay");
    container.innerHTML = `<pre style="white-space: pre-wrap; word-wrap: break-word;">${csvData}</pre>`;
}






// Initialize canvases for encryption and decryption
function initializeCanvas(canvas, stage) {
    const ctx = canvas.getContext("2d");
    canvas.drawing = false; // Ensure drawing state is initialized

    // Event listeners for drawing
    canvas.addEventListener("mousedown", (e) => startDrawing(ctx, canvas, e));
    canvas.addEventListener("mouseup", () => stopDrawing(ctx, canvas));
    canvas.addEventListener("mousemove", (e) => draw(ctx, canvas, e, stage));
    canvas.addEventListener("mouseleave", () => stopDrawing(ctx, canvas));

    // Clear canvas and apply grid overlay
    clearCanvas(canvas);
	applyGridOverlay();
}

// Initialize on page load
window.onload = function () { 
    // Set the current date
    const today = new Date();
    const currentDate = today.toISOString().substr(0, 10); // Extract YYYY-MM-DD from ISO string
    document.getElementById("experimentDate").value = currentDate;

    // Set the current time
    const currentTime = today.toISOString().substr(11, 5); // Extract HH:MM from ISO string
    document.getElementById("experimentTime").value = currentTime;

    // Enable experiment setup fields
    document.querySelectorAll("#experimentSetupForm input, #experimentSetupForm textarea, #experimentSetupForm button").forEach((el) => {
        el.disabled = false;
    });

    // Disable encryption and decryption sections
    document.querySelectorAll("#encryptionSection input, #encryptionSection button, #encryptionSection canvas, #decryptionSection input, #decryptionSection button, #decryptionSection canvas").forEach((el) => {
        el.disabled = true;
    });
	
    // Initialize encryption and decryption canvases
    const encryptionCanvases = [
        document.getElementById("encryptionCanvas1"),
        document.getElementById("encryptionCanvas2"),
        document.getElementById("encryptionCanvas3"),
        document.getElementById("encryptionCanvas4"),
    ];

    const decryptionCanvases = [
        document.getElementById("decryptionCanvas1"),
        document.getElementById("decryptionCanvas2"),
        document.getElementById("decryptionCanvas3"),
        document.getElementById("decryptionCanvas4"),
    ];

    //encryptionCanvases.forEach(initializeCanvas);
    //decryptionCanvases.forEach(initializeCanvas);
	encryptionCanvases.forEach(canvas => initializeCanvas(canvas, "encryption"));
	decryptionCanvases.forEach(canvas => initializeCanvas(canvas, "decryption"));

    // Load the sample model for predictions
    loadPretrainedModel();

    // Ensure Start Experiment button is enabled
    document.querySelector("button[onclick='startExperiment()']").disabled = false;

    // Ensure End Experiment button is disabled
    document.querySelector("button[onclick='endExperiment()']").disabled = true;

    console.log("Page initialized: Experiment setup fields enabled, encryption and decryption sections disabled.");
};


