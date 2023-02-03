OCR-Chrome-Extension
=====================
This application allows for the applying OCR on images.

ALT + O toggles the extension. After toggling and loading the Tesseract worker, a red square cursor will be displayed over your mouse if you hover over images. By holding down shift, you may expand the red cursor into a rectangle and effectively select the area you want to perform OCR on by releasing shift. If you release shift out of bounds of the image, OCR will only be performed on the content contained within the image contained inside the rectangle. Typically using smaller rectangles yield more accurate results, although larger rectangles may be faster.

After the worker completes OCR, the text data will be displayed over the initial image.

I plan on adding additional features like toggling the text on particular images or adding the functionality to video elements. I additionally plan on implementing this into the Zhongwen Chinese Popup Dictionary chrome extension.


Example:
When OCR is toggled (Note Red Square):
--------------------------------------
<img width="509" alt="image" src="https://user-images.githubusercontent.com/84954701/216481474-a644e429-1865-4a01-a850-54aebd6683ff.png">

When Shift is held:
-------------------
<img width="520" alt="image" src="https://user-images.githubusercontent.com/84954701/216481816-4ad4451b-3941-4cf7-904f-e22c37061ae7.png">

Result:
-------
<img width="520" alt="image" src="https://user-images.githubusercontent.com/84954701/216481282-f93addf1-7ccb-4be8-acb1-3509050e9dd0.png">


Result with Zhongwen Popup Extension:
--------------------------------------
<img width="686" alt="image" src="https://user-images.githubusercontent.com/84954701/216481949-55def3b9-7344-4430-b2bd-288399f559cd.png">
