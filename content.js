let performingOCR;

let ocrActivated;

// obj to minimize number of times OCR is performed
let savedImages = {};

let img; // current img selected

let x0, y0;
let x, y;

function enableTab() {
    
    console.log('content working');
    document.addEventListener('keydown', (e) => {

        if(e.altKey) {
            console.log('alt pressed');
        }

        if(e.shiftKey && !e.repeat) {
            x0 = x;
            y0 = y;
        }
    });

    document.addEventListener('keyup', (e) => {
        if(e.altKey) {
            if(e.key === "o") {
                console.log('ocr toggled');
                chrome.runtime.sendMessage({
                    type: 'toggleOCR'
                }, (bool) => {
                    ocrActivated = bool.ocrActivated;
                    performingOCR = bool.performingOCR;
                    updateOCR();
                });
            }
        }

        if(e.key == "Shift") {
            let cursor = document.getElementById('zhongwen-cursor');
            if(cursor && cursor.style.display == '') {

                let rectangle = {left: (x0 - $(img).offset().left),
                                top: (y0 - $(img).offset().top),
                                width: parseInt(cursor.style.width),
                                height: parseInt(cursor.style.height)};
                

                doOCR(img, rectangle);
            }
            hideCursor();
            console.log('cursor hidden');
        }
    });

    updateOCR();
}

function onMouseMoveOCR(mouseMove) {
    x = mouseMove.pageX;
    y = mouseMove.pageY;

        if(performingOCR) {
            hideCursor();
            return;
        }

        let cursor = document.getElementById('zhongwen-cursor');
        if(!cursor) {
            cursor = document.createElement('div');
            cursor.setAttribute('id', 'zhongwen-cursor');
            document.body.appendChild(cursor);
            hideCursor();
        }
        cursor.style.position = 'absolute';
        

        switch (mouseMove.target.nodeName) {
            case 'IMG':
                img = mouseMove.target;
                cursor.style.display = ''; 
                let imgSRC = img.src;

                if(!imgSRC.includes('.png') && !imgSRC.includes('.jpg') && !imgSRC.includes('.jpeg')) {
                    hideCursor();
                    console.log('cursor hidden 71');
                    return; 
                }

                break;
            default:
        }

    if(mouseMove.shiftKey) {
        $(cursor).offset({
            top: y0,
            left: x0
        });
            let height = mouseMove.pageY - y0;
            let width = mouseMove.pageX - x0;
            cursor.style.height = height + 'px';
            cursor.style.width = width + 'px';
            cursor.style.border = '2px solid red'
            cursor.style.backgroundColor = 'transparent';
        } else {
            $(cursor).offset({
                top: mouseMove.pageY,
                left:mouseMove.pageX
            });
            cursor.style.height = '8px';
            cursor.style.width = '8px';
            cursor.style.border = '2px solid red';
            cursor.style.backgroundColor = 'red';
        }

        if(img && !mouseMove.shiftKey) {
            let rect = {};
            rect.left = $(cursor).offset().left;
            rect.top = $(cursor).offset().top;
            rect.bottom = rect.top +  cursor.offsetHeight;
            rect.right = rect.left + cursor.offsetWidth;
            rect.notBound = rect.top < $(img).offset().top;
            rect.notBound = rect.notBound || rect.bottom > ($(img).offset().top + img.offsetHeight);
            rect.notBound = rect.notBound || rect.left < $(img).offset().left;
            rect.notBound = rect.notBound || rect.right > ($(img).offset().left + img.offsetWidth);
            if(rect.notBound) {
                hideCursor();
                img = null;
            } else {
                cursor.style.display = '';
            }
        }



    }
    

function updateOCR() {
    if(ocrActivated) {
        document.addEventListener('mousemove', onMouseMoveOCR);
    } else {
        document.removeEventListener('mousemove', onMouseMoveOCR);
        hideCursor();
        console.log('cursor hidden 103');
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


function hideCursor() {
    let cursor = document.getElementById('zhongwen-cursor');
    if(cursor) {
        cursor.style.display = 'none';
    }
}


function doOCR(inputIMG, rectangle) {
    console.log(rectangle);
    performingOCR = true;
    let tempImg = new Image();
    tempImg.src = inputIMG.src;
    let horF = 1;
    let verF = 1;
    tempImg.onload = () => {
        horF = tempImg.width / inputIMG.width;
        verF = tempImg.height / inputIMG.height;

        rectangle.top *= verF;
        rectangle.left *= horF;
        rectangle.height *= verF;
        rectangle.width *= horF;
        console.log(rectangle);

        chrome.runtime.sendMessage({
            type: 'doOCR',
            image: inputIMG.src,
            rectangle: rectangle
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
                    savedImages[inputIMG] = null;
                    console.log('performing ocr updated ' + performingOCR);
                    return;
                }

                let textDivs = [];

                    data.forEach((word) => {
                        let scaledCoords = {};
                        scaledCoords.x0 = (word.bbox.x0 + rectangle.left) / horF;
                        scaledCoords.y0 = (word.bbox.y0 + rectangle.top) / verF;
                        let div = makeDiv(word, img, scaledCoords);
                        document.body.appendChild(div);
                        div.scrollTop = img.scrollTop; 
                        div.scrollLeft = img.scrollLeft;
                        textDivs.push(div);
                    })
                    
                    savedImages[inputIMG] = textDivs; // plan on adding functionality of enabling and disabling text on images or adding to word list?
                    performingOCR = false;

            })();

        });
}
}

chrome.runtime.onMessage.addListener((message) => {
    ocrActivated = message.ocrActivated;
    performingOCR = message.performingOCR;
    enableTab();
});