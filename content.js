let performingOCR;// going to have to fix this to match the browser value

let ocrActivated;

// obj to minimize number of times OCR is performed
let savedImages = {};

let altKey = false;

function enableTab() {
    
    console.log('content working');
    document.addEventListener('keydown', (e) => {

        if(e.altKey) {
            console.log('alt pressed');
            altKey = true;
        } else {
            altKey = false;
        }
    });

    document.addEventListener('keyup', (e) => {
        if(altKey) {
            if(e.keyCode === 79) {
                console.log('ocr toggled');
                chrome.runtime.sendMessage({
                    type: 'toggleOCR'
                }, (bool) => {
                    ocrActivated = bool.ocrActivated;
                    performingOCR = bool.performingOCR
                    updateOCR();
                });
            }
        }
    });

    updateOCR();
}

function onMouseMoveOCR(mouseMove) {
        if(performingOCR || (mouseMove.target.nodeName !== 'IMG' && mouseMove.target.nodeName !== 'VIDEO' && mouseMove.target.nodeName !== 'CANVAS') || savedImages.hasOwnProperty(mouseMove.target.src)) {
            console.log(performingOCR);
            return;
        }
        performingOCR = true;

        switch (mouseMove.target.nodeName) {
            case 'IMG': {
                let img = mouseMove.target.src;
                if(!img.includes('.png') && !img.includes('.jpg')) {
                    return; 
                }

                chrome.runtime.sendMessage({
                    type: 'doOCR',
                    image: img
                }, (data) => { 
                    console.log('response received');
                    console.log(data);
                    if(data.text) savedImages[img] = data;
                    performingOCR = false;
                }); 
            }
                break;
        }
    }

function updateOCR() {
    if(ocrActivated) {
        document.addEventListener('mousemove', onMouseMoveOCR);
    } else {
        document.removeEventListener('mousemove', onMouseMoveOCR);
    }
}

chrome.runtime.onMessage.addListener((message) => {
    ocrActivated = message.ocrActivated;
    performingOCR = message.performingOCR;
    enableTab();
});