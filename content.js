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
                let imgSRC = mouseMove.target.src;

                if(!imgSRC.includes('.png') && !imgSRC.includes('.jpg') && !imgSRC.includes('.jpeg')) {
                    return; 
                }

                chrome.runtime.sendMessage({
                    type: 'doOCR',
                    image: imgSRC
                }, (dataURL) => { 
                        console.log('response received');
                        (async () => {
                        const dataBlob = await fetch(dataURL).then(response => response.blob());
                        URL.revokeObjectURL(dataURL);
                        dataJSON = await (new Response(dataBlob)).text();
                        
                        const data = JSON.parse(dataJSON);
                        console.log(data);

                        if(data.success === false) {
                            performingOCR = false;
                            savedImages[imgSRC] = null;
                            console.log('performing ocr updated ' + performingOCR);
                            return;
                        }

                        // const chineseData = data.filter((word) => {
                        //     return word.text //chinese data
                        // });
                        let textDivs = [];
                        
                        let img = new Image();
                        img.src = imgSRC;

                        img.onload = () => {
                            //creates the rendered image and its dimensions
                            console.log(img);
                            console.log(img.width, img.height);

                            data.forEach((word) => {
                                let scaledCoords = {};
                                console.log(word.bbox.x0, img.width, mouseMove.target.width);
                                scaledCoords.x0 = (word.bbox.x0 / img.width) * mouseMove.target.width;
                                scaledCoords.y0 = (word.bbox.y0 / img.height) * mouseMove.target.height;
                                console.log(scaledCoords);

                                let div = makeDiv(word, mouseMove.target, scaledCoords);
                                document.body.appendChild(div);
                                div.scrollTop = mouseMove.target.scrollTop;
                                div.scrollLeft = mouseMove.target.scrollLeft;
                                textDivs.push(div);
                            })
                            
                            savedImages[imgSRC] = textDivs;
                            performingOCR = false;
                    }

                    })();

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

function makeDiv(input, img, scaledCoords) {
    let div = document.createElement('div');

    div.id = 'ocrDiv';
    let text = input.text;

    div.innerText = text;

    div.style.cssText = window.getComputedStyle(img, '').cssText;
    div.scrollTop = img.scrollTop;
    div.scrollLeft = img.scrollLeft;
    div.style.position = 'absolute';
    div.style.zIndex = 7000;
    $(div).offset({
        top: $(img).offset().top + scaledCoords.y0,
        left: $(img).offset().left + scaledCoords.x0
    });
    
    return div;

}

chrome.runtime.onMessage.addListener((message) => {
    ocrActivated = message.ocrActivated;
    performingOCR = message.performingOCR;
    enableTab();
});