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
                        workerPath: 'https://unpkg.com/tesseract.js@v2.0.0/dist/worker.min.js',
                        langPath: '/traineddata',
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
            console.log(message.rectangle);

            console.log('ocr executed');
            console.log(message.image);

            const img = new Image();
            img.src = message.image;
            img.onload = () => {
                (async () => {    
                    try {
                        const rectangle = message.rectangle;
                        var tempCanvas = document.createElement('canvas');
                        tempCanvas.width = rectangle.width;
                        tempCanvas.height = rectangle.height;
                        var context = tempCanvas.getContext('2d');       
                        context.drawImage(img, -rectangle.left, -rectangle.top);        
                        const { data: { words } } = await worker.recognize(tempCanvas);
                        performingOCR = false;
                        
                        console.log(words);
                        //filters out non chinese characters
                        let wordsFiltered = words.filter(word => {
                            let u = word.text.charCodeAt(0);

                            return !(isNaN(u) || 
                                        (u !== 0x25CB &&
                                        (u < 0x3400 || 0x9FFF < u) &&
                                        (u < 0xF900 || 0xFAFF < u) &&
                                        (u < 0xFF21 || 0xFF3A < u) &&
                                        (u < 0xFF41 || 0xFF5A < u)));
                        });
                        console.log(wordsFiltered);

                        const wordsJSON = JSON.stringify(wordsFiltered, null, 2);
                        let dataBlob = new Blob([wordsJSON], {type: 'application/json'});
                        let dataURL = URL.createObjectURL(dataBlob);
                        response(dataURL);
                    } catch (err) { 
                        console.log(err);
                        response(URL.createObjectURL(new Blob([JSON.stringify({success: false})]), {type: 'application/json'}));
                    }
                })();
            }
        }
            break;
    }

    // returns true to prevent 'Unchecked runtime.lastError: ...' when dealing with async functions
    return true;
});