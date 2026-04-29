marginTop = 3;
marginBottom = 6;
marginLeft = 7;
marginRight = 7;

orange = (1, 0.549, 0);       // --orange1 #ff8c00
teal   = (0, 0.502, 0.467);  // --teal1   #008077
violet = (0.545, 0.243, 0.753); // --violet1 #8b3ec0
blue   = (0.047, 0.353, 0.651); // --blue1    #0c5aa6
white  = (1,1,1);
black = (0,0,0);

nodeSize = 0.6;
edgeSize = 4;
textSize = 25;
fam = "Nebula Sans";

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
    "nodeIndices": [],
    "nodeCoordinates": [],
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

    diagram.nodeIndices = 1..length(diagramData_1);
    diagram.nodeCoordinates = apply(diagramData_1, [
        lerp(canvasLeft + marginLeft, canvasRight - marginRight, #.x, minX, maxX),
        lerp(canvasBottom + marginBottom, canvasTop - marginTop, #.y, minY, maxY)
    ]);
    diagram.edgeIndices = diagramData_2;
    diagram.labelsFull = diagramData_3;
    diagram.labelsReduced = diagramData_4;
);


getHoveredNodeIndices() := (
    regional(res);

    res = select(diagram.nodeIndices, dist(mouse(), diagram.nodeCoordinates_#) <= nodeSize * 1.1);
    if(length(res) > 0,
        res = sort(res, dist(mouse(), diagram.nodeCoordinates_#))_[1];
    );

    res;
);

hoveredNodeIndices = [];


labelToggles = [
    newToggle({
        "position": canvasAnchors_1 + [6, 3],
        "backColor": 0.9 * white,
        "frontColor": blue

    }),
    newToggle({
        "position": canvasAnchors_1 + [6, 1],
        "backColor": 0.9 * white,
        "frontColor": blue

    })
];
