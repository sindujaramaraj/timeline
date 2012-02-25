function Road(cavas, config) {
    this.canvas = canvas;
    this.height = canvas.height;
    this.width = canvas.width;
    this.context = canvas.getContext("2d");
    this.config = config || {};
    this.laneHeaders = config.laneHeaders || [];
    this.nol = this.laneHeaders.length;
    this.plots = config.plots || [];
    this.topWidth = config.topWidth || (this.width/5);
    this.eachPathWidth = this.width/this.nol;
    this.eachTopPathWidth = this.topWidth/this.nol;
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
(function() {
    Road.prototype = {
        create: function() {
            //calculations
            this.setScale();
            this.drawRoad();
            this.plotTheRoad(); 
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
            this.lanePositionInfo = {};
            var t = (actualPHeight/2)/actualPHeight; //keep the formula as we can change the t value for better curve
            //the bending angle of each path is proportional to the difference between xPos and topXPos
            for (var idx = 0; idx < this.nol; idx++) {
                var grd = this.context.createLinearGradient(xPos, actualPHeight, xPos + this.eachPathWidth,0);
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

                this.lanePositionInfo[idx] = {};
                this.lanePositionInfo[idx].firstCurve = calculateCurvePoint(t, {x:xPos, y:0},
                                                                                    {x:topXPos, y:actualPHeight/2},
                                                                                    {x:topXPos, y:actualPHeight}); 
                this.lanePositionInfo[idx].secondCurve = calculateCurvePoint(t, {x:xPos + this.eachPathWidth, y:0},
                                                                                    {x:topXPos + this.eachTopPathWidth, y:actualPHeight/2},
                                                                                     {x:topXPos + this.eachTopPathWidth, y:actualPHeight});
                this.context.fillStyle = "black";
                this.context.fillRect(this.lanePositionInfo[idx].firstCurve.x, this.lanePositionInfo[idx].firstCurve.y, 5, 5);

                xPos += this.eachPathWidth;            
                topXPos += this.eachTopPathWidth;
                cIdx = !cIdx;
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
            var eventDate, eventPlots = [], eventPlotsMap = {}, eventDateLong;
            //analyse data
            for (; idx < len; idx++) {
                eventData = new Date(this.plots[idx].date);
                eventDateLong = eventData.getTime();
                eventPlots.push(eventDateLong);
                if (eventPlotsMap[eventDateLong]) {
                    eventPlotsMap[eventDateLong].push(this.createEventPlot(this.plots[idx]));
                } else {
                    eventPlotsMap[eventDateLong] = [this.createEventPlot(this.plots[idx])];
                }
            }
            eventPlots.sort(function(a, b) {
                return b - a; //descending
            });
            for (idx = 0; idx < len; idx++) {
                //later add divider also            
                this.plotArea.addPlotElement(eventPlotsMap[eventPlots[idx]]);
            }
            var startingYear = (new Date(eventPlots[0])).getFullYear();
            var endingYear = (new Date(eventPlots[eventPlots.length - 1])).getFullYear();
            this.plotArea.render(startingYear, endingYear);
        },
        createEventPlot: function(plotDetails) {
            plotDetails.firstCurve = this.lanePositionInfo[plotDetails.lane-1].firstCurve;
            plotDetails.secondCurve = this.lanePositionInfo[plotDetails.lane-1].secondCurve;            
            var eventPlot = new EventPlot(this.plotArea, plotDetails);
            return eventPlot;
        },
        createPlot: function(plotDetails) {
            var pDiv = document.createElement("div");
            var pImage = document.createElement("image");
            pImage.src = plotDetails.icon || "image/pin.png";        
            pImage.onload = calculateWidthFactor(pImage, pDiv, 50);
            pDiv.appendChild(pImage);
            this.plotArea.addPlotElement(pDiv);
            pDiv.className = "plotContainer";
            applyStyle(pDiv, {
                                top: "500px",
                                left: "800px"
                            });
        }
    }

    function PlotArea(plotAreaDiv, config) {
        this.area  = plotAreaDiv;
        this.height = config.height;
        this.width = config.width;
        this.plotElements = [];
    }

    PlotArea.finalHeight = 150;

    PlotArea.prototype = {
        render: function(startingYear, endingYear) {
            /*this.mobileLayer = document.createElement("div");
            this.area.appendChild(this.mobileLayer);
            this.layerHeight = this.calculateLayerHeight(endingYear - startingYear + 1);
            applyStyle(this.mobileLayer, { 
                                            height: this.layerHeight + "px",
                                            position: "relative",
                                            bottom: (this.layerHeight - this.height) + "px"});*/
            this.layerHeight = this.calculateLayerHeight(endingYear - startingYear + 1);
            this.startingYear = startingYear;
            this.endingYear = endingYear;
            var currentYear = startingYear;
            var currentPart = 1;
            var currentAltitude = this.height - PlotArea.finalHeight;
            var currentDate;
            for (var idx = 0, len = this.plotElements.length; idx < len; idx++) {
                currentDate = new Date(this.plotElements[idx].config.date);
                if (currentDate.getFullYear() != currentYear) {
                    currentPart += (currentYear - currentDate.getFullYear());                    
                    currentAltitude = this.height - this.calculateLayerHeight(currentPart);
                    currentYear = currentDate.getFullYear();
                }
                this.plotElements[idx].render(currentAltitude,
                                    this.calculateYearSpace(this.plotElements[idx], currentAltitude));
                this.plotElements[idx].setCurrentAltitude(currentAltitude);
            }
            var me = this, plotElement, currentAltitude;
            setInterval(function() {
                for (var idx = 0, len = me.plotElements.length; idx < len; idx++) {
                    plotElement = me.plotElements[idx];
                    currentAltitude = plotElement.getCurrentAltitude() + 0.1;
                    plotElement.adjustToHeight(currentAltitude,
                                    me.calculateYearSpace(plotElement, currentAltitude));
                    plotElement.setCurrentAltitude(currentAltitude);
                }    
            }, 0);
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
            plotDate = new Date(plot.date);
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
        }
    };

    function MovableElement(parentContainer, config) {
        this.parentContainer = parentContainer;
        this.config = config;
    }

    MovableElement.prototype = {
        render: function() {
        },    
        adjustToHeight: function() {
        },
        getFinalHeight: function() {
        },
        setCurrentAltitude: function(currentAltitude) {}
    };

    function EventPlot(parentContainer, config) {
        MovableElement.call(this, parentContainer, config);
        this.date = new Date(config.date);
    }
    
    EventPlot.finalHeight = 90;

    EventPlot.initialHeight = 10;

    extend(EventPlot, MovableElement, {
        render: function render(baseTop, yearLength) {
            var position = this.calculateLeftAndTop(baseTop, yearLength);
            var pDiv = document.createElement("div");
            var pImage = document.createElement("image");
            pImage.src = this.config.icon || "image/pin.png";        
            pImage.onload = calculateWidthFactor(pImage, pDiv, position.height);
            pDiv.appendChild(pImage);
            pDiv.className = "plotContainer";
            
            applyStyle(pDiv, {
                                bottom: (this.parentContainer.height - position.top) + "px",
                                left: position.left + position.xDiff + "px"
                            });
            this.parentContainer.appendChild(pDiv);
            this.element = pDiv;
        },    
        adjustToHeight: function(baseTop, yearLength) {
            var position = this.calculateLeftAndTop(baseTop, yearLength);
            this.element.firstChild.height = position.height;
            this.element.firstChild.width = position.height * this.element.firstChild.widthFactor;
            applyStyle(this.element, {
                                bottom: (this.parentContainer.height - position.top) + "px",
                                left: position.left + position.xDiff + "px",
                                height: position.height,
                                width: this.element.firstChild.offsetWidth + "px"
                            });
        },
        calculateLeftAndTop: function(baseTop, yearLength) {
            var top = baseTop + (yearLength/12 * this.getDate().getMonth()) ;
            var height = EventPlot.initialHeight + ((top/this.parentContainer.height)
                                                        * (EventPlot.finalHeight - EventPlot.initialHeight)) ;
            var bottomX = this.config.lane * EventPlot.bottomPathWidth;
            var topX = EventPlot.topX + (this.config.lane * EventPlot.topPathWidth);

            var d11 = (this.config.firstCurve.x - bottomX)/(this.parentContainer.height - this.config.firstCurve.y);
            var d12 = (topX - this.config.firstCurve.x)/this.config.firstCurve.y;
            var xDiff = (this.config.secondCurve.x - this.config.firstCurve.x)/2;
            var left;            
            //correct this formula
            if (top > this.config.firstCurve.y) {
                left = (this.parentContainer.height - top)*d11; 
            } else {
                left = this.config.firstCurve.x + ((this.config.firstCurve.y - top)*d12);  
            }
            return {left: left, top: top, height: height, xDiff: xDiff};                        
        },
        getFinalHeight: function() {
            return EventPlot.finalHeight;
        },
        getDate: function() {
            return this.date;
        },
        setCurrentAltitude: function(currentAltitude) {
            this.currentAltitude = currentAltitude;
        },
        getCurrentAltitude: function() {
            return this.currentAltitude;
        }
    });

    function MonthDivider(parentContainer, config) {
    }

    extend(MonthDivider, MovableElement, {
        adjustToHeight: function() {
        }
    });

    function applyStyle(element, styles) {
        for (var style in styles) {
            element.style[style] = styles[style];
        }
    }

    function calculateWidthFactor(image, div, hValue) {
        return function() {
            var height = image.offsetHeight;
            var width = image.offsetWidth;
            var widthFactor = parseFloat(width/height);
            image.height = hValue;
            image.width = hValue * widthFactor;
            applyStyle(div, {
                                height: hValue,
                                width: hValue*widthFactor
                            });
            image.widthFactor = widthFactor;
        }
    }

    function calculateCurvePoint(t, P0, P1, P2) {
        var t1 = 1-t;
        var tsq = t*t;
        var denom = 2.0*t*t1;
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
})();
