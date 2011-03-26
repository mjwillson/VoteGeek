window.onload = function() {
  window.canvas = Raphael("container");

  canvas.customAttributes.segment = function (x, y, r, a1, a2) {
    var flag = (a2 - a1) > Math.PI;
    return {
      path: [
        ["M", x, y],
        ["l", r * Math.cos(a1), r * Math.sin(a1)],
        ["A", r, r, 0, +flag, 1, x + r * Math.cos(a2), y + r * Math.sin(a2)],
        ["z"]
      ]
    };
  };
  
  plotConstituency("St Albans");
}

var colors = {
  lab: '#f00',
  lib: '#ff0',
  con: '#00f',
  oth: '#ccc'
}
var fadedColors = {
  lab: '#700',
  lib: '#770',
  con: '#007',
  oth: '#444'
}

var parties = ['lab','lib','con','oth'];
var secondChoiceParties = {
  'lab': ['con','oth','lib'],
  'lib': ['lab', 'oth','con'],
  'con': ['lib','oth','lab'],
  'oth': ['con','lib','lab']
}

function plotConstituency(constituencyName, predictedScenarioName, baseScenarioName) {
  var previousResult    = constituencies[constituencyName];
  var baseScenario      = electionScenarios[baseScenarioName || "2010 General Election under AV"];
  var predictedScenario = electionScenarios[predictedScenarioName || "Populous/Times 23 June"];

  var firstChoices = predictConstituencyFPPResult(previousResult, baseScenario, predictedScenario);
   secondChoices = {};
  for (party in predictedScenario) {
    var transfers = predictedScenario[party].transfers;
    secondChoices[party] = {total: 0}
    for (otherParty in transfers) {
      secondChoices[party][otherParty] = firstChoices[party] * predictedScenario[party].transfers[otherParty];
      secondChoices[party].total += secondChoices[party][otherParty];
    }
  }

  var firstChoiceSegments = {};
  var cumulativeAngle = 0;
  parties.forEach(function(party) {
    var proportion = firstChoices[party], angle = proportion * Math.PI * 2;
    
        // second choices
    var secondChoiceGap = (proportion - secondChoices[party].total)/(secondChoiceParties[party].length-1)*2*Math.PI,
        secondCumAng = cumulativeAngle;

    secondChoiceParties[party].forEach(function(secondParty) {
      var secondProportion = secondChoices[party][secondParty], secondAngle = secondProportion*2*Math.PI;
      var path = canvas.path();
      path.attr({segment: [250, 250, 250, secondCumAng, secondCumAng + secondAngle], fill: fadedColors[secondParty]});
      secondCumAng += secondAngle + secondChoiceGap;
      console.log('plotting second choice '+party+' '+secondParty+' '+secondProportion, secondChoices);
    })
    
    var path = canvas.path();
    path.attr({segment: [250, 250, 125, cumulativeAngle, cumulativeAngle + angle], fill: colors[party]});
    firstChoiceSegments[party] = [cumulativeAngle, angle, path];
    
    cumulativeAngle += angle;
  })
}
