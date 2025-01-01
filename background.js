chrome.action.onClicked.addListener((tab) => {
    const pageUrl = tab.url;
    const pageTitle = tab.title;

    chrome.storage.sync.get(['links'], (result) => {
        const links = result.links || [];
        const existingIndex = links.findIndex((link) => link.url === pageUrl);

        if (existingIndex === -1) {
            // Add new link
            links.push({ url: pageUrl, title: pageTitle });
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icon128.png',
                title: 'Link Added',
                message: `Added: ${pageTitle}`
            });
        } else {
            // Update title if the link already exists
            links[existingIndex].title = pageTitle;
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icon128.png',
                title: 'Link Updated',
                message: `Updated: ${pageTitle}`
            });
        }

        // Save back to storage
        chrome.storage.sync.set({ links }, () => {
            console.log('Link added/updated:', { url: pageUrl, title: pageTitle });
        });
    });
});
