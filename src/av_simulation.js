var parties = ['con','lib','lab','oth'];

function predictConstituencyFPPResult(previousResult, previousNationalScenario, predictedNationalScenario) {
  var predictedFirstChoices = {}, firstChoiceTotal = 0;

  // fairly crude model based on an absolute percentage swing, then renormalising after cropping
  // anyone pushed below zero by this swing.
  parties.forEach(function(party) {
    var swing = predictedNationalScenario[party].firstChoice - previousNationalScenario[party].firstChoice;

    var prediction = previousResult[party] + swing;
    if (prediction < 0) prediction = 0;
    if (prediction > 1) prediction = 1;

    firstChoiceTotal += prediction;
    predictedFirstChoices[party] = prediction;
  })

  // now we have to renormalise, since some extreme predicted values may have been cropped at 0 or 1,
  // leading to the total no longer summing up to one:
  parties.forEach(function(party) {
    predictedFirstChoices[party] /= firstChoiceTotal;
  })

  return predictedFirstChoices;
}

function calculateAVResult(firstChoices, scenario) {
  var party, result = {};
  for (party in firstChoices) result[party] = firstChoices[party];

  while (true) {
    // if someone has over 50%, they win:
    for (party in result) if (result[party] > 0.5) return result;

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
    var transfers = scenario[leastParty].transfers;
    for (party in transfers) {
      var transferProportion = transfers[party];
      if (result[party]) result[party] += transferProportion * firstChoices[party];
    }
    
    // since 'no second choice' is an option, not all of the votes have been redistributed,
    // so we need to renormalize:
    var total = 0;
    for (party in result) total += result[party];
    for (party in result) result[party] /= total;
    
    //... this must terminate eventually, worst case 1 party is left and the above
    // has renormalised them to have 100%
  }
}

function calculateWinner(votes) {
  var biggestParty, biggestVote = 0;
  for (party in votes) {
    var vote = votes[party];
    if (vote > biggestVote) {
      biggestVote = vote;
      biggestParty = party;
    }
  }
  return biggestParty;
}

function calculateAVWinner(firstChoices, transfers) {
  return calculateWinner(calculateAVResult(firstChoices, transfers));
}

function predictConstituencyAVResult(previousResult, previousNationalScenario, predictedNationalScenario) {
  var predictedFirstChoices = predictConstituencyFPPResult(previousResult, previousNationalScenario, predictedNationalScenario);
  return calculateAVResult(predictedFirstChoices, predictedNationalScenario);
}

function predictAVWinner(previousResult, previousNationalScenario, predictedNationalScenario) {
  var predictedFirstChoices = predictConstituencyFPPResult(previousResult, previousNationalScenario, predictedNationalScenario);
  return calculateAVWinner(predictedFirstChoices, predictedNationalScenario);
}