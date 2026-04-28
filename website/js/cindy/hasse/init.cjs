marginTop = 3;
marginBottom = 3;
marginLeft = 10;
marginRight = 10;

orange = (1, 0.549, 0);       // --orange1 #ff8c00
teal   = (0, 0.502, 0.467);  // --teal1   #008077
violet = (0.545, 0.243, 0.753); // --violet1 #8b3ec0
white  = (1,1,1);
black = (0,0,0);

nodeSize = 0.6;

// **************************************************

processTimer = 0.1;
processTimerActive = false;
time = seconds();

startProcessTimer() := (
    delta = 0;
    time = seconds();
    processTimerActive = true;
    playanimation();
);


diagramData = [];

diagram = {
    "coordinates": [],
    "edgeIndices": [],
    "labelsFull": [],
    "labelsReduced": []
};
processDiagramData() := (
    regional(minX, minY, maxX, maxY);

    recalculateAnchors();

    minX = min(diagramData_1, #.x);
    minY = min(diagramData_1, #.y);
    maxX = max(diagramData_1, #.x);
    maxY = max(diagramData_1, #.y);

    diagram.coordinates = apply(diagramData_1, [
        lerp(canvasLeft + marginLeft, canvasRight - marginRight, #.x, minX, maxX),
        lerp(canvasBottom + marginBottom, canvasTop - marginTop, #.y, minY, maxY)
    ]);
    diagram.edgeIndices = diagramData_2;
    diagram.labelsFull = diagramData_3;
    diagram.labelsReduced = diagramData_4;
);