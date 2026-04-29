
forall(diagram.edgeIndices,
    draw(diagram.nodeCoordinates_#_1, diagram.nodeCoordinates_#_2, size -> edgeSize, color -> 0.4 * white);
);
forall(diagram.nodeCoordinates,
    fillcircle(#, nodeSize, color -> orange);
    drawcircle(#, nodeSize, color -> orange * 0.8, size -> 3);
);

forall(if(labelToggles_1.state == 0, hoveredNodeIndices, diagram.nodeIndices),
    label = if(labelToggles_2.state == 0, diagram.labelsFull_#, diagram.labelsReduced_#);
    point = diagram.nodeCoordinates_#;
    if(label_1 != [],
        forall(label_1, text, index,
            drawtext(point + [-nodeSize, -0.012 * textSize + lerp(-1, 1, index, 1, length(label_1)) * 0.5 * length(label_1) * 2 * 1.3 * 0.012 * textSize], text, bold -> true, align -> "right", family -> fam, outlinewidth -> 5, outlinecolor -> white, color -> if(labelToggles_1.state == 0 % contains(hoveredNodeIndices, #), teal, 0.6 * white), size -> 0.8 * textSize);
        );
    );
    if(label_2 != [],
        forall(label_2, text, index,
            drawtext(point + [ nodeSize, -0.012 * textSize + lerp(-1, 1, index, 1, length(label_2)) * 0.5 * length(label_2) * 2 * 1.3 * 0.012 * textSize], text, bold -> true, align -> "left", family -> fam, outlinewidth -> 5, outlinecolor -> white, color -> if(labelToggles_1.state == 0 % contains(hoveredNodeIndices, #), violet, 0.6 * white), size -> 0.8 * textSize);
        );
    );
);


forall(labelToggles, #.draw);
drawtext(labelToggles_1.position + [0, 1.5], "Labels", align -> "mid", size -> textSize, family -> fam);

drawtext(labelToggles_1.position + [-2, -0.012 * textSize], "hover", align -> "right", size -> textSize, family -> fam);
drawtext(labelToggles_1.position + [ 2, -0.012 * textSize], "always", align -> "left", size -> textSize, family -> fam);

drawtext(labelToggles_2.position + [-2, -0.012 * textSize], "full", align -> "right", size -> textSize, family -> fam);
drawtext(labelToggles_2.position + [ 2, -0.012 * textSize], "reduced", align -> "left", size -> textSize, family -> fam);