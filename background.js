const { createWorker, PSM } = Tesseract;
let worker;

let ocrActivated = false;
let performingOCR = false;

chrome.tabs.onActivated.addListener( (activeInfo) => {
    enableTab(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if(changeInfo.status === 'complete') {
        enableTab(tabId);
    }
});

function enableTab(tabId) {
    console.log('tab enabled');
    chrome.tabs.sendMessage(tabId, { ocrActivated, performingOCR });
}

chrome.runtime.onMessage.addListener((message, sender, response) => {
    switch(message.type) {
        case "toggleOCR": {
            (async () => { 
                if(ocrActivated) {
                    ocrActivated = false;
                    await worker.terminate();
                } else {
                    ocrActivated = true;

                    worker = createWorker({
                        workerPath: './js/worker.min.js',
                        langPath: './traineddata',
                        corePath: 'https://unpkg.com/tesseract.js-core@v2.0.0/tesseract-core.wasm.js',
                    });

                    await worker.load();
                    await worker.loadLanguage('chi_sim+chi_tra');
                    await worker.initialize('chi_sim+chi_tra');
                    await worker.setParameters({
                        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
                    });
                }
                response({ ocrActivated, performingOCR });
            })();
        }
            break;


        case "doOCR": {
            
            if(performingOCR) return;
            performingOCR = true;

            console.log('ocr executed');

            (async () => {    
                try {                        
                    const { data } = await worker.recognize(message.image);
                    performingOCR = false;
                    
                    console.log(data);
                    response(data);
                } catch (err) { 
                    console.log(err);// it receives the error but no response?
                    response(err);
                }
            })();
        }
            break;
    }

    // returns true to prevent 'Unchecked runtime.lastError: ...' when dealing with async functions
    return true;
});