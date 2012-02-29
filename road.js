(function() {
    //variable local to function scope

    var imageInfo = {};
    var lanePositionInfo = {};
    var nol;

    function Road(canvas, config) {
        this.canvas = canvas;
        this.height = canvas.height;
        this.width = canvas.width;
        this.context = canvas.getContext("2d");
        this.config = config || {};
        this.laneHeaders = config.laneHeaders || [];
        nol = this.laneHeaders.length;
        this.plots = config.plots || [];
        this.topWidth = config.topWidth || (this.width/5);
        this.eachPathWidth = this.width/nol;
        this.eachTopPathWidth = this.topWidth/nol;
        /*
         var config = {
         laneHeaders: ["Lane 1", "Lane 2", "Lane 3", "Lane 4", "Lane 5"],
         plots: [
         {id: 1, date: "July 20, 2008", event: "", lane: 0 //lane index},
         {id; 2, date: "Sep 16, 2010", event: "", lane: 1}, ...
         ]
         };
         */
    }

    Road.prototype = {
        create: function() {
            //calculations
            this.setScale();
            this.drawRoad();
            this.plotTheRoad();
            this.createNavigator();
        },
        drawRoad: function() {
            //create header div
            var headers = document.createElement("div");
            headers.className = "headers";
            headers.style.width = this.canvas.offsetWidth + "px";
            this.canvas.parentNode.appendChild(headers);

            //assign colors        
            var rColors = {"true": "#eeeeee", "false": "#cccccc"};
            var hColors = {"true": "#174662", "false": "#8BA2B0"};
            var cIdx = true;

            //calculate positions
            var hHeight = parseInt(headers.offsetHeight);
            var pHeight = this.height - hHeight;
            var actualPHeight = pHeight - 1;
            headers.style.top = (this.canvas.offsetTop + pHeight) + "px";
            var xPos = 0, yPos = pHeight;
            var topXPos = (this.width - this.topWidth)/2, topYPos = 0;
            var t = (actualPHeight/2)/actualPHeight; //keep the formula as we can change the t value for better curve
            //the bending angle of each path is proportional to the difference between xPos and topXPos
            for (var idx = 0; idx < nol; idx++) {
                var grd = this.context.createLinearGradient(xPos, actualPHeight, xPos + this.eachPathWidth, 0);
                grd.addColorStop(0.05, rColors[cIdx]);
                grd.addColorStop(0.95, "white");
                this.context.fillStyle = rColors[cIdx]; //grd;            
                this.context.beginPath();
                this.context.moveTo(xPos, actualPHeight);
                this.context.quadraticCurveTo(topXPos, actualPHeight/2, topXPos, topYPos);
                this.context.lineTo(topXPos + this.eachTopPathWidth, topYPos);
                this.context.quadraticCurveTo(topXPos + this.eachTopPathWidth, actualPHeight/2, xPos + this.eachPathWidth, actualPHeight);
                this.context.lineTo(xPos, actualPHeight);
                
                this.context.fill();

                //draw header
                this.context.fillStyle = hColors[cIdx];
                this.context.fillRect(xPos, yPos, this.eachPathWidth, hHeight);
                //create header div
                var headerDiv = document.createElement("div");
                headerDiv.className = "fLeft header";
                headerDiv.style.width = this.eachPathWidth + "px";
                headerDiv.style.height = hHeight + "px";

                //write header text
                headers.appendChild(headerDiv);
                headerDiv.innerHTML = this.laneHeaders[idx];
                lanePositionInfo[idx] = {};
                lanePositionInfo[idx].bottomX1 = xPos;
                lanePositionInfo[idx].topX1 = topXPos;
                //see how the curve is formed                
                /*for (var k = 0; k <= 1;) {
                    var firstCurve = calculateCurvePoint(k, {x:xPos, y:0},
                                                                                        {x:topXPos, y:actualPHeight/2},
                                                                                        {x:topXPos, y:actualPHeight}); 
                    var secondCurve = calculateCurvePoint(k, {x:xPos + this.eachPathWidth, y:0},
                                                                                        {x:topXPos + this.eachTopPathWidth, y:actualPHeight/2},
                                                                                         {x:topXPos + this.eachTopPathWidth, y:actualPHeight});
                    this.context.fillStyle = "black";
                    this.context.fillRect(firstCurve.x, actualPHeight - firstCurve.y, 2, 2);
                    k += 0.005;
                }*/

                xPos += this.eachPathWidth;            
                topXPos += this.eachTopPathWidth;
                cIdx = !cIdx;
                lanePositionInfo[idx].bottomX2 = xPos;
                lanePositionInfo[idx].topX2 = topXPos;
            }
            this.actualHeight = actualPHeight;
        },
        setScale: function() {
            var scaleDiv = document.createElement("div");
            scaleDiv.className = "scale";
            this.canvas.parentNode.insertBefore(scaleDiv, this.canvas);        
        },
        plotTheRoad: function() {
            //create plot area div element        
            var plotAreaDiv = document.createElement("div");
            plotAreaDiv.className = "plotArea";
            applyStyle(plotAreaDiv, {
                                        top: this.canvas.offsetTop + "px",
                                        height: this.actualHeight + "px",
                                        width: this.width + "px"
                                        });
            this.canvas.parentNode.appendChild(plotAreaDiv);

            //set required constants on EventPlot
            EventPlot.bottomPathWidth = this.eachPathWidth;
            EventPlot.topPathWidth = this.eachTopPathWidth;
            EventPlot.topX = (this.width - this.topWidth)/2;
            this.plotArea = new PlotArea(plotAreaDiv, {
                                                        height: this.actualHeight,
                                                        width: this.width});
            var idx = 0, len = this.plots.length;
            var eventData, eventPlots = [], eventPlotsMap = {}, eventDateLong;
            //analyse data
            for (; idx < len; idx++) {
                eventData = new Date(this.plots[idx].date);
                eventDateLong = eventData.getTime();
                if (eventPlotsMap[eventDateLong]) {
                    eventPlotsMap[eventDateLong].push(this.createEventPlot(this.plots[idx]));
                } else {
                    eventPlotsMap[eventDateLong] = [this.createEventPlot(this.plots[idx])];
                    eventPlots.push(eventDateLong);
                }
            }
            eventPlots.sort(function(a, b) {
                return b - a; //descending
            });
            var startingYear = (new Date(eventPlots[0])).getFullYear();
            var endingYear = (new Date(eventPlots[eventPlots.length - 1])).getFullYear();
            var year = endingYear;
            var plotElements;
            len = eventPlots.length;
            for (idx = 0; idx < len; idx++) {
                plotElements = eventPlotsMap[eventPlots[idx]];
                //later add divider also
                this.plotArea.addPlotElement(plotElements);
                if (plotElements[0].date.getFullYear() != year) {
                    this.plotArea.addPlotElement(new YearDivider(this.plotArea, {year: year, date: new Date("January 1," + year)}));
                    year = plotElements[0].date.getFullYear();
                }
            }
            this.plotArea.addPlotElement(new YearDivider(this.plotArea, {year: startingYear, date: new Date("January 1," + startingYear)}));
            this.plotArea.render(startingYear, endingYear);
        },
        createEventPlot: function(plotDetails) {
            var eventPlot = new EventPlot(this.plotArea, plotDetails);
            return eventPlot;
        },
        createNavigator: function() {
            var me = this;
            var navigator = document.createElement("div");
            navigator.className = "navigator";
            var upBtn = document.createElement("button");
            upBtn.innerHTML = "Up";
            upBtn.onmouseover = function() {
                setInterval(function() {
                    me.plotArea.moveUp();
                }, 0);

            };
            upBtn.onmouseout = function() {
                me.plotArea.stopMovingUp();
            }
            var downBtn = document.createElement("button");
            downBtn.innerHTML = "Down";
            downBtn.onmouseover = function() {
                setInterval(function() {
                    me.plotArea.moveDown();
                }, 0);
            };
            downBtn.onmouseout = function() {
                me.plotArea.stopMovingDown();
            }
            navigator.appendChild(upBtn);
            navigator.appendChild(downBtn);
            this.plotArea.appendChild(navigator);
        }
    }

    function PlotArea(plotAreaDiv, config) {
        this.area  = plotAreaDiv;
        this.height = config.height;
        this.width = config.width;
        this.plotElements = [];
    }

    PlotArea.finalHeight = 150;
    PlotArea.moveConstant = 0.0005;

    PlotArea.prototype = {
        render: function(startingYear, endingYear) {
            this.startingYear = startingYear;
            this.endingYear = endingYear;
            var currentAltitude = this.height - PlotArea.finalHeight;
            this._render(currentAltitude);
            /*var me = this, plotElement, currentAltitude;
            setInterval(function() {
                for (var idx = 0, len = me.plotElements.length; idx < len; idx++) {
                    plotElement = me.plotElements[idx];
                    currentAltitude = plotElement.getCurrentAltitude() + 0.50;
                    plotElement.adjustToHeight(currentAltitude,
                                    me.calculateYearSpace(plotElement, currentAltitude));
                    plotElement.setCurrentAltitude(currentAltitude);
                }
            }, 0);*/
        },
        _render: function(currentAltitude) {
            var currentYear = this.startingYear;
            var currentPart = 1;
            var currentDate;
            for (var idx = 0, len = this.plotElements.length; idx < len; idx++) {
                currentDate = this.plotElements[idx].date;
                if (currentDate.getFullYear() != currentYear) {
                    currentPart += (currentYear - currentDate.getFullYear());
                    currentAltitude = this.height - this.calculateLayerHeight(currentPart);
                    currentYear = currentDate.getFullYear();
                }
                this.plotElements[idx].render(currentAltitude,
                    this.calculateYearSpace(this.plotElements[idx], currentAltitude));
                this.plotElements[idx].setCurrentAltitude(currentAltitude);
            }
        },
        addPlotElement: function(plotElements) {
            this.plotElements = this.plotElements.concat(plotElements);
        },
        calculateLayerHeight: function(nParts) {
            var totalHeight = 0;
            for (var idx = 0; idx < nParts; idx++) {
                totalHeight += (PlotArea.finalHeight * Math.pow(0.85, idx));
            }
            return totalHeight;
        },
        calculateYearSpace: function(plot, yearStartingHeight) {
            var plotDate = new Date(plot.date);
            var remainingDisplayHeight = this.height - yearStartingHeight;
            var allowedSpace = 0;
            var parts = 0;
            var projectedHeight;
            //calculate how much space can be alloted for a year segement at particular height            
            while(true) {
                projectedHeight = this.calculateLayerHeight(parts);                
                if (remainingDisplayHeight > projectedHeight) {
                    parts++;
                } else {
                    //adjust the height differece
                    var diffHeight = projectedHeight - remainingDisplayHeight;
                    allowedSpace = (PlotArea.finalHeight * Math.pow(0.85, parts)) + (diffHeight * 0.85);
                    break;
                }
            }
            return allowedSpace;                          
        },
        appendChild: function(child) {
            this.area.appendChild(child);
        },
        moveUp: function() {
            for (var idx = 0, len = this.plotElements.length; idx < len; idx++) {
                this.plotElements[idx].moveUp();
            }
        },
        moveDown: function() {
            for (var idx = 0, len = this.plotElements.length; idx < len; idx++) {
                this.plotElements[idx].moveDown();
            }
        },
        stopMovingUp: function() {

        },
        stopMovingDown: function() {

        }
    };

    function MovableElement(parentContainer, config) {
        this.parentContainer = parentContainer;
        this.config = config;
        this.date = new Date(config.date);
        this.totalHeight = this.parentContainer.height;
    }

    MovableElement.prototype = {
        render: function() {},
        adjustToHeight: function() {},
        getFinalHeight: function() {},
        setCurrentAltitude: function(currentAltitude) {
            this.currentAltitude = currentAltitude;
        },
        getCurrentAltitude: function() {
            return this.currentAltitude;
        }
    };

    function EventPlot(parentContainer, config) {
        MovableElement.call(this, parentContainer, config);
        this.positionInfo = lanePositionInfo[this.config.lane - 1];
    }
    
    EventPlot.finalHeight = 80;

    EventPlot.initialHeight = 10;

    extend(EventPlot, MovableElement, {
        render: function (baseTop, yearLength) {
            var position = this._calculateLeftAndTop(baseTop, yearLength, true);
            var pDiv = document.createElement("div");
            pDiv.className = "plotContainer";
            pDiv.id = this.config.id;
            var pImage = new Image();
            var imgsrc = this.config.icon || "image/pin.png";
            pDiv.appendChild(pImage);
            this.parentContainer.appendChild(pDiv);
            pImage.src = imgsrc;
            pImage.onload = calculateWidthFactor(pImage, pDiv, position);
            this.element = pDiv;
            this.image = pImage;
            this.t = position.t;
        },
        _calculateLeftAndTop: function(baseTop, yearLength) {
            var top = baseTop + (yearLength/12 * this.getDate().getMonth());
            var t = 1 - (top/this.totalHeight);

            var cp1 = this._calculateCP1(t);
            var cp2 = this._calculateCP2(t);

            var height = this._calculateHeight(top);
            var xDiff = (cp2.x - cp1.x)/2;
            return {left: cp1.x + xDiff, top: top, height: height, t: t};
        },
        _calculateHeight: function(top) {
            return EventPlot.initialHeight + ((top/this.totalHeight)
                * (EventPlot.finalHeight - EventPlot.initialHeight)) ;
        },
        _calculateCP1: function(t) {
            return calculateCurvePoint(t, {x:this.positionInfo.bottomX1, y:0},
                {x:this.positionInfo.topX1, y:this.totalHeight/2},
                {x:this.positionInfo.topX1, y:this.totalHeight});
        },
        _calculateCP2: function(t) {
            return calculateCurvePoint(t, {x:this.positionInfo.bottomX2, y:0},
                {x:this.positionInfo.topX2, y:this.totalHeight/2},
                {x:this.positionInfo.topX2, y:this.totalHeight});
        },
        getFinalHeight: function() {
            return EventPlot.finalHeight;
        },
        getDate: function() {
            return this.date;
        },
        moveUp: function() {
            this.t += PlotArea.moveConstant;
            this._adjustPosition();
        },
        moveDown: function() {
            this.t -= PlotArea.moveConstant;
            this._adjustPosition();
        },
        _adjustPosition: function() {
            var cp1 = this._calculateCP1(this.t);
            var cp2 = this._calculateCP2(this.t);
            var top = this.totalHeight - cp1.y;
            var height = this._calculateHeight(top);
            var xDiff = (cp2.x - cp1.x)/2;
            this.image.height = height;
            this.image.width = height * imageInfo[this.image.src];
            applyStyle(this.element, {
                top: (top - height) + "px",
                left: (cp1.x + xDiff - (this.image.offsetWidth/2)) + "px",
                height: height + "px",
                width: this.image.offsetWidth + "px"
            });
        },
        adjustToHeight: function(baseTop, yearLength) {
            var position = this._calculateLeftAndTop(baseTop, yearLength);
            this.image.height = position.height;
            this.image.width = position.height * imageInfo[this.image.src];
            applyStyle(this.element, {
                top: (position.top - position.height) + "px",
                left: (position.left - (this.image.offsetWidth/2)) + "px",
                height: position.height,
                width: this.image.offsetWidth + "px"
            });
        }
    });

    function YearDivider(parentContainer, config) {
        MovableElement.call(this, parentContainer, config);
        this.year = config.year;
        this.bottomX1 = lanePositionInfo[0].bottomX1;
        this.bottomX2 = lanePositionInfo[nol-1].bottomX2;
        this.topX1 = lanePositionInfo[0].topX1;
        this.topX2 = lanePositionInfo[nol-1].topX2;
    }

    extend(YearDivider, MovableElement, {
        render: function(baseTop) {
            var containerDiv = document.createElement("div");
            var yDiv = document.createElement("div");
            yDiv.className = "divider";
            var position = this._calculateWidth(baseTop);
            applyStyle(yDiv, {
                left: position.left + "px",
                top: position.top + "px",
                width: position.width + "px",
                display: position.top < 0 ? "none" : ""
            });
            var tDiv = document.createElement("div");
            tDiv.innerHTML = this.year;
            tDiv.className = "dividerText";
            applyStyle(tDiv, {
                left: position.left + position.width + "px",
                top: position.top + "px",
                display: position.top < 0 ? "none" : ""
            });
            containerDiv.appendChild(yDiv);
            containerDiv.appendChild(tDiv);
            this.parentContainer.appendChild(containerDiv);
            this.divider = yDiv;
            this.text = tDiv;
            this.t = position.t;
            this.top = position.top;
        },
        _calculateWidth: function(top) {
            var t = 1 - (top/this.totalHeight);
            var cp1 = this._calculateCP1(t);
            var cp2 = this._calculateCP2(t);
            return {left: cp1.x, top: top, width: cp2.x - cp1.x, t: t};
        },
        _calculateCP1: function(t) {
            return calculateCurvePoint(t, {x:this.bottomX1, y:0},
                                            {x:this.topX1, y: this.totalHeight/2},
                                            {x: this.topX1, y: this.totalHeight});
        },
        _calculateCP2: function(t) {
            return calculateCurvePoint(t, {x:this.bottomX2, y:0},
                                            {x:this.topX2, y: this.totalHeight/2},
                                            {x: this.topX2, y: this.totalHeight});
        },
        moveUp: function() {
            this.t += PlotArea.moveConstant;
            this._adjustPosition();
        },
        moveDown: function() {
            this.t -= PlotArea.moveConstant;
            this._adjustPosition();
        },
        _adjustPosition: function() {
            var cp1 = this._calculateCP1(this.t);
            var top = this.totalHeight - cp1.y;
            if (top < 0 || top > this.totalHeight) {
                this.divider.style.display = "none";
                this.text.style.display = "none";
                return;
            }
            var cp2 = this._calculateCP2(this.t);

            applyStyle(this.divider, {
                left: cp1.x + "px",
                top: top + "px",
                width: (cp2.x - cp1.x) + "px",
                display: ""
            });
            applyStyle(this.text, {
                left: cp2.x + "px",
                top: top + "px",
                display: ""
            });
        },
        adjustToHeight: function(baseTop) {
            var position = this._calculateWidth(baseTop);
            applyStyle(this.divider, {
                left: position.left + "px",
                top: position.top + "px",
                width: position.width + "px"
            });
            applyStyle(this.text, {
                left: position.left + position.width + "px",
                top: position.top + "px"
            });
        }
    });


    //common functions local to this function scope
    function applyStyle(element, styles) {
        for (var style in styles) {
            element.style[style] = styles[style];
        }
    }

    function calculateWidthFactor(image, div, position) {
        return function() {
            var widthFactor = imageInfo[image.src];
            if (!imageInfo[image.src]) {
                var height = image.offsetHeight;
                var width = image.offsetWidth;
                widthFactor = parseFloat(width/height);
                imageInfo[image.src] = widthFactor;
            }
            image.height = position.height;
            image.width = position.height * widthFactor;
            applyStyle(div, {
                    height: position.height + "px",
                    width: position.height * widthFactor + "px",
                    top: position.top - position.height + "px",
                    left: position.left - (position.height * widthFactor/2) + "px",
                    display: position.top < 0 ? "none" : ""
            });
        }
    }

    function calculateCurvePoint(t, P0, P1, P2) {
        var t1 = 1-t;
        var tsq = t*t;
        /* refer http://www.algorithmist.net/bezier2.html */
        var Cx = (t1*t1*P0.x) + 2*t*t1*P1.x + (t*t*P2.x);
        var Cy = (t1*t1*P0.y) + 2*t*t1*P1.y + (t*t*P2.y); 
        return {x: Cx, y: Cy};
    }

    function extend(childClass, parentClass, customObj) {
        for (var member in parentClass.prototype) {
            customObj[member] = customObj[member] || parentClass.prototype[member];
        }
        childClass.prototype = customObj;
        childClass.prototype.super = parentClass.prototype;
    }

    window.Road = Road;
})();
