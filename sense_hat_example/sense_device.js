// Library for geometry operations
window.Geometry = {
    _Eps: 1e-5
};

/**
 * Creates a new Transform matrix (Chrome fu, FireFox fu)
 */
Geometry.Matrix = function () {
    if (window.WebKitCSSMatrix) {
        return new WebKitCSSMatrix();
    } else if (window.DOMMatrix) {
        return new DOMMatrix();
    } else if (window.MSCSSMatrix) {
        // IE10
        return new MSCSSMatrix();
    } else {
        // maybe use Polyfill
        throw Error('Matrix not supported by the browser!');
    }
}

/**
 * transpose matrix a and return t
 */
Geometry.Matrix.T = function(a) {
    var t = Geometry.Matrix();

    // first row
    t.m11 = a.m11;
    t.m12 = a.m21;
    t.m13 = a.m31;
    t.m14 = a.m41;

    // 2nd row
    t.m21 = a.m12;
    t.m22 = a.m22;
    t.m23 = a.m32;
    t.m24 = a.m42;

    // 3rd row
    t.m31 = a.m13;
    t.m32 = a.m23;
    t.m33 = a.m33;
    t.m34 = a.m43;

    // 4th row
    t.m41 = a.m14;
    t.m42 = a.m24;
    t.m43 = a.m34;
    t.m44 = a.m44;

    return t;
}

Geometry.Vector = function(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
}

Geometry.Vector.prototype = {
    length: function() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    },
    normalize: function() {
        var length = this.length();
        if (length <= Geometry._Eps)
            return;

        this.x /= length;
        this.y /= length;
        this.z /= length;
    },
    multiply: function (scalar) {
        return new Geometry.Vector(this.x * scalar, this.y * scalar, this.z * scalar);
    },
    divide: function (scalar) {
        return new Geometry.Vector(this.x / scalar, this.y / scalar, this.z / scalar);
    },
    toString: function () {
        return "(" + this.x + ", " + this.y + ", " + this.z + ")";
    },
    asArray: function () {
        return [this.x, this.y, this.z];
    }
}

/**
 * Caclucate angle from 2 vectors
 */
Geometry.calculateAngle = function(u, v) {
    var uLength = u.length();
    var vLength = v.length();
    if (uLength <= Geometry._Eps || vLength <= Geometry._Eps)
        return 0;
    var cos = Geometry.scalarProduct(u, v) / uLength / vLength;
    if (Math.abs(cos) > 1)
        return 0;
    return Geometry.radToDeg(Math.acos(cos));
}

Geometry.vectorSubstraction = function(u, v) {
    var x = u.x - v.x;
    var y = u.y - v.y;
    var z = u.z - v.z;

    return new Geometry.Vector(x, y, z);
}

Geometry.degToRad = function(deg) {
    return deg * (Math.PI / 180); // we could use constants here
}

Geometry.radToDeg = function(rad) {
    return rad * 180 / Math.PI; // we could use constants here
}

Geometry.scalarProduct = function(u, v) {
    return u.x * v.x + u.y * v.y + u.z * v.z;
}

Geometry.crossProduct = function(u, v) {
    var x = u.y * v.z - u.z * v.y;
    var y = u.z * v.x - u.x * v.z;
    var z = u.x * v.y - u.y * v.x;
    return new Geometry.Vector(x, y, z);
}

Geometry.EulerAngles = function(alpha, beta, gamma) {
    this.alpha = alpha;
    this.beta = beta;
    this.gamma = gamma;
}

/**
 * Caclucate euler angles from a rotation matrix
 */
Geometry.EulerAngles.fromRotationMatrix = function(rotationMatrix) {
    var beta = Math.atan2(rotationMatrix.m23, rotationMatrix.m33);
    var gamma = Math.atan2(-rotationMatrix.m13, Math.sqrt(rotationMatrix.m11 * rotationMatrix.m11 + rotationMatrix.m12 * rotationMatrix.m12));
    var alpha = Math.atan2(rotationMatrix.m12, rotationMatrix.m11);
    return new Geometry.EulerAngles(Geometry.radToDeg(alpha), Geometry.radToDeg(beta), Geometry.radToDeg(gamma));
}

/**
 * Stores the alpha, beta, gamma (yaw, pitch, roll) values
 * and creates a timestamp on object creation
 */
function DeviceOrientation(alpha, beta, gamma) {
    this.alpha = alpha;
    this.beta = beta;
    this.gamma = gamma;
    this.timestamp = DeviceOrientation.getTimestamp(); // always create a timestamp
}

/**
 * Return the current orientation as x,y,z vector
 * 
 * Using the following mapping: g:  yaw: alpha (z), pitch: gamma (y), roll: beta (x)
 */
DeviceOrientation.prototype.asVector = function() {
    return new Geometry.Vector(this.beta, this.gamma, this.alpha);
}

window.DeviceOrientation = DeviceOrientation;

/**
 * Validate user input, returns DeviceOrientation or null
 */
DeviceOrientation.parseUserInput = function (alphaString, betaString, gammaString) {
    function isUserInputValid(value) {
        if (!value)
            return true;
        return /^[-]?[0-9]*[.]?[0-9]*$/.test(value);
    }

    if (!alphaString && !betaString && !gammaString) {
        return null;
    }

    var isAlphaValid = isUserInputValid(alphaString);
    var isBetaValid = isUserInputValid(betaString);
    var isGammaValid = isUserInputValid(gammaString);

    if (!isAlphaValid && !isBetaValid && !isGammaValid) {
        return null;
    }

    var alpha = isAlphaValid ? parseFloat(alphaString) : -1;
    var beta = isBetaValid ? parseFloat(betaString) : -1;
    var gamma = isGammaValid ? parseFloat(gammaString) : -1;

    return new DeviceOrientation(alpha, beta, gamma);
}

DeviceOrientation.getTimestamp = function () {
    // Return a common timestamp in microseconds
    var time = Date.now(); // millis
    var timestamp = (time * 1000) | 0; // microseconds and forced int
    return timestamp;
}

/**
 * DeviceOrientationInput class
 */
function DeviceOrientationInput(elements, options) {
    this._stageElement = elements.stageElement;
    this._boxElement =  elements.boxElement;
    this._alphaElement =  elements.alphaInput;
    this._betaElement =  elements.betaInput;
    this._gammaElement =  elements.gammaInput;
    
    this._resetButton =  elements.resetButton;
    
    this._boxMatrix;
    this._currentMatrix;
    this._isDragging = false;
    
    var deviceOrientation;
    if (options && options.deviceOrientation && options.deviceOrientation instanceof DeviceOrientation) {
        deviceOrientation = options.deviceOrientation;
    } else {
        deviceOrientation = new DeviceOrientation(0, 0, 0);
    }
    
    this.options = options;
    
    this._setDeviceOrientation(deviceOrientation, 'InitialInput');
}

DeviceOrientationInput.getEventX = function(event) {
    if (event.x) {
        return event.x;
    }
    
    if (event.clientX) {
        return event.clientX;
    }
}

DeviceOrientationInput.getEventY = function(event) {
    if (event.y) {
        return event.y;
    }
    
    if (event.clientY) {
        return event.clientY;
    }
}

DeviceOrientationInput.prototype.bindToEvents = function() {
    //Drag.installDragHandle(this._stageElement, this._onBoxDragStart.bind(this), this._onBoxDrag.bind(this), this._onBoxDragEnd.bind(this), "move");
    this._dragHandle();
    this._resetButton.addEventListener('click', this._resetDeviceOrientation.bind(this));
    
    this._alphaElement.addEventListener('input', this._applyDeviceOrientationUserInput.bind(this));
    this._betaElement.addEventListener('input', this._applyDeviceOrientationUserInput.bind(this));
    this._gammaElement.addEventListener('input', this._applyDeviceOrientationUserInput.bind(this));
}

DeviceOrientationInput.prototype._dragHandle = function() {
    function isMac() {
        return navigator.platform === 'MacIntel' || navigator.platform === 'MacPPC' || navigator.platform === 'Mac68K';
    }

    function mouseDownHandler(event) {
        // Only drag upon left button, not on right button or context menu clicks
        if (event.button || (isMac() && event.ctrlKey))
            return;
            
        // can this happen?
        if (this._isDragging === true) {
            return;
        }
        
        if (this._dragPane && this._dragPane.remove) {
            this._dragPane.remove();
        }
        
        this._isDragging = true
        this._onBoxDragStart(event);
    }
    
    function mouseMoveHandler(event) {
        if (this._isDragging === true) {
            //event.preventDefault();
            this._onBoxDrag(event);
        }
    }
    
    function mouseUpHandler(event) {
        if (this._isDragging === true) {
            //event.preventDefault();
            
            this._isDragging = false;
            this._onBoxDragEnd(event);
            
            // clean up dragPane
            if (this._dragPane && this._dragPane.remove) {
                this._dragPane.remove();
            }
        }
    }
    
    function mouseOutHandler(event) {
        if (this._isDragging === true) {
            // create a pane, so that you can drag everywhere
            createDragPane.apply(this);
            
            if (this._dragPane) {
                // register events
                this._dragPane.addEventListener('mousemove', mouseMoveHandler.bind(this));    
                this._dragPane.addEventListener('touchmove', mouseMoveHandler.bind(this));  

                this._dragPane.addEventListener('mouseup', mouseUpHandler.bind(this));
                this._dragPane.addEventListener('touchend', mouseUpHandler.bind(this));
            }   
        }
    }
    
    function createDragPane() {
        this._dragPane = document.createElement("div");
        this._dragPane.style.cssText = "position:absolute;top:0;bottom:0;left:0;right:0;background-color:transparent;z-index:1000;overflow:hidden;";
        this._dragPane.id = "drag-pane";
        document.body.appendChild(this._dragPane);
        
        function handlePaneOut(event) {
            mouseUpHandler.apply(this, event);
        }

        this._dragPane.addEventListener('mouseout', handlePaneOut.bind(this));
        this._dragPane.addEventListener('touchcancel', handlePaneOut.bind(this));
    }
    
    this._stageElement.addEventListener('mousedown', mouseDownHandler.bind(this));    
    this._stageElement.addEventListener('touchstart', mouseDownHandler.bind(this));    

    this._stageElement.addEventListener('mousemove', mouseMoveHandler.bind(this));    
    this._stageElement.addEventListener('touchmove', mouseMoveHandler.bind(this));   

    this._stageElement.addEventListener('mouseup', mouseUpHandler.bind(this));
    this._stageElement.addEventListener('touchend', mouseUpHandler.bind(this));

    
    this._stageElement.addEventListener('mouseout', mouseOutHandler.bind(this));
    this._stageElement.addEventListener('touchcancel', mouseOutHandler.bind(this));
}

/**
 * Calculate radius vector after dragging
 */
DeviceOrientationInput.prototype._calculateRadiusVector = function (x, y) {
    var rect = this._stageElement.getBoundingClientRect();
    var radius = Math.max(rect.width, rect.height) / 2;
    var sphereX = (x - rect.left - rect.width / 2) / radius;
    var sphereY = (y - rect.top - rect.height / 2) / radius;
    var sqrSum = sphereX * sphereX + sphereY * sphereY;
    if (sqrSum > 0.5)
        return new Geometry.Vector(sphereX, sphereY, 0.5 / Math.sqrt(sqrSum));

    return new Geometry.Vector(sphereX, sphereY, Math.sqrt(1 - sqrSum));
};

DeviceOrientationInput.prototype._onBoxDragEnd = function() {
    this._boxMatrix = this._currentMatrix;
};

DeviceOrientationInput.prototype._onBoxDragStart = function (event) {
    this._mouseDownVector = this._calculateRadiusVector(DeviceOrientationInput.getEventX(event), DeviceOrientationInput.getEventY(event));

    if (!this._mouseDownVector)
        return false;

    event.preventDefault();
    return true;
};

DeviceOrientationInput._matrixToCSSString = function (matrix) {
    function generateCSSString(matrix){
        var str = '';
        str += matrix.m11.toFixed(20) + ',';
        str += matrix.m12.toFixed(20) + ',';
        str += matrix.m13.toFixed(20) + ',';
        str += matrix.m14.toFixed(20) + ',';
        str += matrix.m21.toFixed(20) + ',';
        str += matrix.m22.toFixed(20) + ',';
        str += matrix.m23.toFixed(20) + ',';
        str += matrix.m24.toFixed(20) + ',';
        str += matrix.m31.toFixed(20) + ',';
        str += matrix.m32.toFixed(20) + ',';
        str += matrix.m33.toFixed(20) + ',';
        str += matrix.m34.toFixed(20) + ',';
        str += matrix.m41.toFixed(20) + ',';
        str += matrix.m42.toFixed(20) + ',';
        str += matrix.m43.toFixed(20) + ',';
        str += matrix.m44.toFixed(20);

        return 'matrix3d(' + str + ')';
    }

    if (window.DOMMatrix && matrix instanceof window.DOMMatrix) {
        var lang = navigator.language;
        if (lang && lang.indexOf("en") >= 0) {
            return matrix.toString(); // save on englisch systems    
        }
        
        return generateCSSString(matrix);
    }
    
    return matrix.toString();
}

DeviceOrientationInput.prototype._onBoxDrag = function(event) {
    var mouseMoveVector = this._calculateRadiusVector(DeviceOrientationInput.getEventX(event), DeviceOrientationInput.getEventY(event));
    if (!mouseMoveVector)
        return true;

    event.preventDefault();
    var axis = Geometry.crossProduct(this._mouseDownVector, mouseMoveVector);
    axis.normalize();
    var angle = Geometry.calculateAngle(this._mouseDownVector, mouseMoveVector);
    
    var matrix = Geometry.Matrix();
    var rotationMatrix = matrix.rotateAxisAngle(axis.x, axis.y, axis.z, angle);
    this._currentMatrix = rotationMatrix.multiply(this._boxMatrix);
    
    // Crossbrowser and cross locale way of outputing the string
    var matrixString = DeviceOrientationInput._matrixToCSSString(this._currentMatrix);
    
    this._boxElement.style.webkitTransform = matrixString;
    this._boxElement.style.mozTransform = matrixString;
    this._boxElement.style.transform = matrixString;
    
    var eulerAngles = Geometry.EulerAngles.fromRotationMatrix(this._currentMatrix);
    
    var newOrientation = new DeviceOrientation(-eulerAngles.alpha, -eulerAngles.beta, eulerAngles.gamma);
    
    this._setDeviceOrientation(newOrientation, "UserDrag");
    return false;
};

/**
 * Update the draggable box position after user input
 */
DeviceOrientationInput.prototype._setBoxOrientation = function(deviceOrientation) {
    var matrix = Geometry.Matrix();
    
    this._boxMatrix = matrix.rotate(-deviceOrientation.beta, deviceOrientation.gamma, -deviceOrientation.alpha);
    
     var matrixString = DeviceOrientationInput._matrixToCSSString(this._boxMatrix);
    this._boxElement.style.webkitTransform = matrixString;
    this._boxElement.style.mozTransform = matrixString;
    this._boxElement.style.transform = matrixString;
};

/**
 * Handle user input
 */
DeviceOrientationInput.prototype._applyDeviceOrientationUserInput = function(event) {
    event.preventDefault();
    this._setDeviceOrientation(DeviceOrientation.parseUserInput(this._alphaElement.value.trim(), this._betaElement.value.trim(), this._gammaElement.value.trim()), "UserInput");
}

/**
 * Resets the orientation to (0, 0, 0)
 */
DeviceOrientationInput.prototype._resetDeviceOrientation = function(event) {
    event.preventDefault();
    this._setDeviceOrientation(new DeviceOrientation(0, 0, 0), "ResetButton");
}

/**
 * Sets the device orientation after a change
 */
DeviceOrientationInput.prototype._setDeviceOrientation = function(deviceOrientation, modificationSource) {
    if (!deviceOrientation)
        return;

    if (modificationSource != "UserInput") {
        this._alphaElement.value = deviceOrientation.alpha;
        this._betaElement.value = deviceOrientation.beta;
        this._gammaElement.value = deviceOrientation.gamma;
    }

    if (modificationSource != "UserDrag")
        this._setBoxOrientation(deviceOrientation);

    if (this.options && this.options.onDeviceOrientationChange) {
        this.options.onDeviceOrientationChange.call(null, deviceOrientation);
    }
};