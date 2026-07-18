const text = `
Module: CSA Mixed - All Modules
Type: MCQ

1. What is the correct navigation path to create a new user in ServiceNow?
A) All > System Security > Users > New
B) All > User Administration > Users > New
C) All > Self-Service > Profiles > New
D) All > System Properties > User Registry > New

2. Which role gives a user access to ALL features and capabilities in a ServiceNow instance?
A) itil
B) security_admin
C) catalog_admin
D) admin

---ANSWERS---
1 B
2 D
61 A,C,D
`;

function parseQuestions(text) {
  const parts = text.split(/---ANSWERS---/i);
  if (parts.length < 2) {
    throw new Error('Specific format required: Must include ---ANSWERS--- section at the bottom.');
  }
  
  const mainText = parts[0];
  const answersText = parts[1];
  
  const answerDict = {};
  const ansRegex = /^(\d+)\s+([A-Z](?:,[A-Z])*)/gm;
  let m;
  while ((m = ansRegex.exec(answersText)) !== null) {
    answerDict[m[1]] = m[2].split(',').map(s => s.trim());
  }

  const qRegex = /(?:^|\n)(\d+)\.\s+([\s\S]*?)(?=(?:\n\d+\.\s+)|$)/g;
  const questions = [];
  
  while ((m = qRegex.exec(mainText)) !== null) {
    const qNum = m[1];
    let qContent = m[2].trim();
    
    const optRegex = /\n([A-Z])\)\s+([\s\S]*?)(?=\n[A-Z]\)\s+|$)/g;
    let options = [];
    let qText = qContent;
    
    const firstOptMatch = /\n[A-Z]\)\s+/.exec('\n' + qContent);
    if (firstOptMatch) {
        qText = ('\n' + qContent).substring(0, firstOptMatch.index).trim();
        
        let optM;
        const optsText = ('\n' + qContent).substring(firstOptMatch.index);
        while ((optM = optRegex.exec(optsText)) !== null) {
            options.push({ letter: optM[1], text: optM[2].trim() });
        }
    }
    
    if (options.length === 0) continue; 
    
    const ansLetters = answerDict[qNum];
    if (!ansLetters) continue; 
    
    const answerIndices = [];
    ansLetters.forEach(letter => {
        const idx = options.findIndex(o => o.letter === letter);
        if (idx !== -1) answerIndices.push(idx);
    });
    
    questions.push({
      scenario: qText,
      options: options.map(o => o.text),
      answer: answerIndices,
      type: "MCQ",
      explanation: "Parsed from document."
    });
  }
  
  return questions;
}

console.log(JSON.stringify(parseQuestions(text), null, 2));
