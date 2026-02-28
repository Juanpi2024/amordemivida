const key = "AIzaSyBVU4yAx1fcjwxdW0FJAcJ8A83QSMPzJ-I";
async function listNames() {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.models) {
            console.log("AVAILABLE MODELS:");
            data.models.forEach(m => console.log("- " + m.name));
        } else {
            console.log("ERROR:", data);
        }
    } catch (e) {
        console.log("FETCH ERROR:", e.message);
    }
}
listNames();
