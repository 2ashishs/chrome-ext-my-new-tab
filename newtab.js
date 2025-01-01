const linkList = document.getElementById('link-list');
const newLinkInput = document.getElementById('new-link');

// Load links from Chrome storage
function loadLinks() {
    chrome.storage.sync.get(['links'], (result) => {
        const links = result.links || [];
        linkList.innerHTML = '';
        links.forEach((linkObj, index) => {
            const listItem = document.createElement('li');
            const anchor = document.createElement('a');
            const deleteButton = document.createElement('button');

            anchor.href = linkObj.url;
            anchor.textContent = linkObj.title || linkObj.url;
            anchor.target = '_blank';

            deleteButton.textContent = 'x';
            deleteButton.onclick = () => {
                deleteLink(index);
            };

            listItem.appendChild(anchor);
            listItem.appendChild(deleteButton);
            linkList.appendChild(listItem);
        });
    });
}

// Save links to Chrome storage
function saveLinks(links) {
    chrome.storage.sync.set({ links }, () => {
        console.log('Links saved.');
    });
}

// Fetch the title of a URL
async function fetchTitle(url) {
    try {
        const response = await fetch(url);
        const text = await response.text();
        const doc = new DOMParser().parseFromString(text, 'text/html');
        const title = doc.querySelector('title')?.textContent || url;
        return title.trim();
    } catch (error) {
        console.error('Failed to fetch title:', error);
        return url; // Fallback to URL if fetching title fails
    }
}

// Add a new link
newLinkInput.addEventListener('keypress', async (event) => {
    if (event.key === 'Enter' || event.keyCode === 13) {
        const link = newLinkInput.value.trim();
        if (link) {
            const title = await fetchTitle(link); // Fetch title
            chrome.storage.sync.get(['links'], (result) => {
                const links = result.links || [];
                links.push({ url: link, title: title }); // Store URL and title
                saveLinks(links);
                newLinkInput.value = '';
                loadLinks();
            });
        }
    }
});

// Delete a link
function deleteLink(index) {
    chrome.storage.sync.get(['links'], (result) => {
        const links = result.links || [];
        links.splice(index, 1);
        saveLinks(links);
        loadLinks();
    });
}

// Initialize the page
// loadLinks();

// Listen for changes in storage
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "sync" && changes.links) {
        loadLinks(); // Update the UI
    }
});

// Fetch and display links on page load
document.addEventListener("DOMContentLoaded", loadLinks);

// Export links as JSON
document.getElementById('export-links').addEventListener('click', () => {
    chrome.storage.sync.get(['links'], (result) => {
        const links = result.links || [];
        const jsonExport = {};

        links.forEach((linkObj) => {
            jsonExport[linkObj.url] = linkObj.title || linkObj.url;
        });

        const blob = new Blob([JSON.stringify(jsonExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'links.json';
        a.click();
        URL.revokeObjectURL(url);
    });
});

// Import links from JSON
document.getElementById('import-file').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonImport = JSON.parse(e.target.result);

                chrome.storage.sync.get(['links'], (result) => {
                    const existingLinks = result.links || [];
                    const updatedLinks = [...existingLinks];

                    Object.entries(jsonImport).forEach(([url, title]) => {
                        const index = existingLinks.findIndex((linkObj) => linkObj.url === url);
                        if (index !== -1) {
                            // Update existing link title
                            updatedLinks[index].title = title;
                        } else {
                            // Add new link
                            updatedLinks.push({ url, title });
                        }
                    });

                    saveLinks(updatedLinks);
                    loadLinks();
                });
            } catch (error) {
                console.error('Error importing JSON:', error);
                alert('Invalid JSON file.');
            }
        };
        reader.readAsText(file);
    }
});
