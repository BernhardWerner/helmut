if(processTimerActive,
    delta = seconds() - time;
    time = seconds();
    processTimer = processTimer - delta;

    if(processTimer < 0,
        stopanimation();
        processDiagramData();
    );
);