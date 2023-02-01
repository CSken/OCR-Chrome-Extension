OCR-Chrome-Extension
This application allows for the applying OCR on images.

ALT + O toggles the extension. After toggling and loading the Tesseract worker, a red square cursor will be displayed over your mouse if you hover over images. By holding down shift, you may expand the red cursor into a rectangle and effectively select the area you want to perform OCR on by releasing shift. If you release shift out of bounds of the image, OCR will only be performed on the content contained within the image contained inside the rectangle. Typically using smaller rectangles yield more accurate results, although larger rectangles may be faster.

After the worker completes OCR, the text data will be displayed over the initial image.

I plan on adding additional features like toggling the text on particular images or adding the functionality to video elements. I additionally plan on implementing this into the Zhongwen Chinese Popup Dictionary chrome extension.