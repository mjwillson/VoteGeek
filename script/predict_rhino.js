load('./src/av_simulation.js')

function loadJSON(filename) {
  var json = readFile(filename);
  var data;
  eval("data = "+json);
  return data;
}

var constituencies = loadJSON('./data/constituencies.json');
var scenarios = loadJSON('./data/election_scenarios.json');

var baseScenario = scenarios["2010 General Election under AV"];
var predictedScenario = scenarios["Populous/Times 23 June"];

for (name in constituencies) {
  var previousConstituencyResult = constituencies[name];
  var predictedWinner = predictAVWinner(previousConstituencyResult, baseScenario, predictedScenario);
  print("Predicted winner in "+name+" is "+predictedWinner);
}