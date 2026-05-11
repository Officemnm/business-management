const fs = require('fs');
let code = fs.readFileSync('src/app/api/dashboard/stats/route.ts', 'utf8');

code = code.replace(
  'const dateFrom = searchParams.get("from");\n  const dateTo = searchParams.get("to");',
  `const dateFrom = searchParams.get("from");
  const dateTo = searchParams.get("to");
  const targetUser = searchParams.get("targetUser");
  
  // If targetUser is provided and user is admin, use targetUser. Otherwise, if not admin, use current username.
  const queryUsername = (isAdmin && targetUser) ? targetUser : username;
  const shouldFilterByUser = !isAdmin || !!targetUser;`
);

code = code.replace(
  /\.\.\.\(\!isAdmin \? \{ createdBy: username \} : \{\}\)/g,
  '...((shouldFilterByUser) ? { createdBy: queryUsername } : {})'
);

code = code.replace(
  /\.\.\.\(\!isAdmin \? \{ collectedBy: username \} : \{\}\)/g,
  '...((shouldFilterByUser) ? { collectedBy: queryUsername } : {})'
);

code = code.replace(
  /const userFilter = isAdmin \? \{\} : \{ createdBy: username \};/g,
  'const userFilter = shouldFilterByUser ? { createdBy: queryUsername } : {};'
);

code = code.replace(
  /const customerFilter = isAdmin \? \{ active: true \} : \{ createdBy: username, active: true \};/g,
  `const customerFilter = shouldFilterByUser ? { createdBy: queryUsername, active: true } : { active: true };`
);

fs.writeFileSync('src/app/api/dashboard/stats/route.ts', code, 'utf8');
console.log("Updated API route")