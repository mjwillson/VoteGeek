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
var humanPartyNames = {
  lab: 'Labour',
  lib: 'Liberal Democrats',
  con: 'Conservatives',
  oth: 'Other'
}
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

  document.getElementById('title').innerHTML = 'How would Alternative vote work in '+constituencyName+'?'

  var firstChoices = predictConstituencyFPPResult(previousResult, baseScenario, predictedScenario);
   secondChoices = {};
  for (party in predictedScenario) {
    var transfers = predictedScenario[party].transfers;
    secondChoices[party] = {total: 0}
    for (otherParty in transfers) {
      secondChoices[party][otherParty] = firstChoices[party] * predictedScenario[party].transfers[otherParty];
    }
  }
  
  var party, result = {};
  for (party in firstChoices) result[party] = firstChoices[party];
  var paths

  function plotNext() {
    console.log("plotting", result);

    // plot the situation:
    paths = pathsFor(result, secondChoices);
    canvas.clear();
    paths.forEach(function(path) {
      canvas.path().attr(path);
    })
    
    // if someone has over 50%, they win, stop:
    var done = false;
    for (party in result) if (result[party] > 0.5) return;

    // otherwise, we eliminate the party with the least votes:
    var leastParty, leastProportion = 1;
    for (party in result) {
      if (result[party] < leastProportion) {
        leastProportion = result[party];
        leastParty = party;
      }
    }
    delete result[leastParty];

    // and we transfer their share of the first choice vote, to second choices
    // (where those second choices haven't already been eliminated):
    var transfers = secondChoices[leastParty];
    for (party in transfers) {
      var transferProportion = transfers[party];
      if (result[party]) result[party] += transferProportion;
    }
    
    // since 'no second choice' is an option, not all of the votes have been redistributed,
    // so we need to renormalize:
    var total = 0;
    for (party in result) total += result[party];
    for (party in result) result[party] /= total;
  }

  window.onkeydown = function(event) {
    if (event.keyCode == 32) plotNext();
  }
}

function pathsFor(proportions, secondProportions) {
  var paths = [];

  var firstChoiceSegments = {};
  var cumulativeAngle = 0;
  parties.forEach(function(party) {
    if (!(party in proportions)) return;
    var proportion = proportions[party], angle = proportion * Math.PI * 2;
    
    // second choices for this party
    var secondChoicesInContention = [], secondChoiceTotal = 0;
    secondChoiceParties[party].forEach(function(p) {
      if (!(p in proportions)) return;
      secondChoicesInContention.push(p);
      secondChoiceTotal += secondProportions[party][p];
    });

    var secondChoiceGap = (proportion - secondChoiceTotal)/(secondChoicesInContention.length-1)*2*Math.PI,
        secondCumAng = cumulativeAngle;

    secondChoicesInContention.forEach(function(secondParty) {
      var secondProportion = secondProportions[party][secondParty], secondAngle = secondProportion*2*Math.PI;
      paths.push({
        segment: [250, 250, 250, secondCumAng, secondCumAng + secondAngle],
        fill: fadedColors[secondParty],
        title: humanPartyNames[party]+' voters\' second choice for '+humanPartyNames[secondParty]
      })
      secondCumAng += secondAngle + secondChoiceGap;
      console.log('plotting second choice '+party+' '+secondParty+' '+secondProportion, secondChoices);
    })
    
    paths.push({
      text: "foo",
      segment: [250, 250, 125, cumulativeAngle, cumulativeAngle + angle],
      fill: colors[party],
      title: humanPartyNames[party]+' have ' + proportion*100 + '% of the vote',
      proportion: proportion
    });

    cumulativeAngle += angle;
  })
  return paths;
}